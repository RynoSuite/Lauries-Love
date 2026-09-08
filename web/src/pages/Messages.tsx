import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, currentUserId } from '../lib/supabase';
import { useFeatureFlags } from '../lib/featureFlags';
import { MessageAttachment } from '../components/MessageAttachment';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { IconPencil, IconTrash } from '../components/Icons';
import { NewGroupThread } from '../components/NewGroupThread';
import { ThreadHeader } from '../components/ThreadHeader';
import { Avatar } from '../components/Avatar';

// Supabase storage caps a standard upload at 50MB; 25 keeps well inside that
// and keeps a member on mobile data from sending something enormous by accident.
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

type Conversation = {
  id: string;
  is_group: boolean;
  // Set when the thread belongs to a community group, in which case its
  // membership follows the group and cannot be edited from here.
  group_id: string | null;
  name: string | null;
  last_message_body: string | null;
  last_message_at: string | null;
  members: {
    profile: {
      id: string;
      display_name: string | null;
      first_name: string | null;
      avatar_path: string | null;
    };
  }[];
};
type Message = {
  id: string;
  body: string | null;
  sender_id: string;
  created_at: string;
  attachment_path: string | null;
  edited_at: string | null;
};
type MemberHit = {
  id: string;
  display_name: string | null;
  first_name: string | null;
};

// Date separators and timestamps. A thread spanning weeks reads as one
// continuous conversation without them, and "when did they say that" is the
// question people actually ask of a chat history.
function sameDay(a: string, b: string) {
  const x = new Date(a);
  const y = new Date(b);
  return x.toDateString() === y.toDateString();
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  const withinAWeek = Date.now() - d.getTime() < 7 * 86400000;
  return d.toLocaleDateString(undefined, {
    weekday: withinAWeek ? 'long' : undefined,
    month: withinAWeek ? undefined : 'short',
    day: withinAWeek ? undefined : 'numeric',
    year:
      d.getFullYear() === today.getFullYear() || withinAWeek ? undefined : 'numeric',
  });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function fetchConversations(): Promise<Conversation[]> {
  const me = await currentUserId();
  if (!me) return [];
  const { data: memberships } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('profile_id', me);
  const ids = (memberships ?? []).map((m) => m.conversation_id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from('conversations')
    .select(
      'id, is_group, group_id, name, last_message_body, last_message_at, members:conversation_members(profile:profiles(id, display_name, first_name, avatar_path))',
    )
    .in('id', ids)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  return (data ?? []) as unknown as Conversation[];
}

function othersOf(c: Conversation, meId: string | null) {
  return c.members.map((m) => m.profile).filter((p) => p.id !== meId);
}

// A named group uses its name. An unnamed one is named by the people in it,
// which is what makes it recognisable at a glance — but four full names do not
// fit a 16rem rail, so past two the rest become a count.
function convTitle(c: Conversation, meId: string | null) {
  if (c.name) return c.name;
  const names = othersOf(c, meId).map((p) => p.display_name || p.first_name || 'Member');
  if (names.length === 0) return 'Conversation';
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}

export function Messages() {
  const { isEnabled } = useFeatureFlags();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [meId, setMeId] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState<Message[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  // New-conversation composer state.
  const [composing, setComposing] = useState(false);
  // 'direct' searches every member; 'group' picks from your connections.
  const [composeMode, setComposeMode] = useState<'direct' | 'group'>('direct');
  const [search, setSearch] = useState('');
  const [hits, setHits] = useState<MemberHit[]>([]);
  const [starting, setStarting] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState(false);

  useEffect(() => {
    currentUserId().then(setMeId);
  }, []);

  const convos = useQuery({ queryKey: ['conversations'], queryFn: fetchConversations });

  // Deep link: /messages?c=<id> (e.g. from a member's Message button) opens it.
  useEffect(() => {
    const c = searchParams.get('c');
    if (c) setActive(c);
  }, [searchParams]);

  // Member search for starting a new DM (debounced).
  useEffect(() => {
    if (!composing) return;
    const q = search.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const me = await currentUserId();
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, first_name')
        .or(`display_name.ilike.%${q}%,first_name.ilike.%${q}%`)
        .neq('id', me ?? '')
        .eq('active', true)
        .limit(8);
      if (!cancelled) setHits((data ?? []) as MemberHit[]);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, composing]);

  // Load messages + subscribe to realtime for the open conversation.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    supabase
      .from('messages')
      .select('id, body, sender_id, created_at, attachment_path, edited_at')
      .eq('conversation_id', active)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (!cancelled) setMsgs((data ?? []) as Message[]);
      });
    const channel = supabase
      .channel(`web-conv-${active}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${active}` },
        (payload) => setMsgs((prev) => [...prev, payload.new as Message]),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [active]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // Opening a conversation marks it read, which is what clears the nav badge.
  // conversation_members has no update policy, so a member cannot move their
  // own read marker directly; the RPC does it for them. Runs on every message
  // change so a reply arriving while the thread is open does not re-badge it.
  useEffect(() => {
    if (!active) return;
    void supabase
      .rpc('mark_conversation_read', { p_conversation_id: active })
      .then(() => qc.invalidateQueries({ queryKey: ['unread'] }));
  }, [active, msgs.length, qc]);

  // The open conversation, for the header and for sender attribution.
  const activeConv = (convos.data ?? []).find((c) => c.id === active) ?? null;
  const senderById = new Map(
    (activeConv?.members ?? []).map((m) => [m.profile.id, m.profile]),
  );

  async function send() {
    if (!text.trim() || !active) return;
    const me = await currentUserId();
    const body = text.trim();
    setText('');
    await supabase.from('messages').insert({ conversation_id: active, sender_id: me, body });
    qc.invalidateQueries({ queryKey: ['conversations'] });
  }

  // Attachments go to the private chat-attachments bucket. The storage policy
  // gates on conversation membership by reading the FIRST path segment as a
  // conversation id, so the path shape is not cosmetic: it is the access
  // check. Same convention the mobile app writes, so files sent from either
  // surface open on both.
  async function sendAttachment(file: File) {
    if (!active) return;
    setAttachError(null);
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachError('Files need to be under 25MB.');
      return;
    }
    setAttaching(true);
    try {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase().slice(0, 8);
      const path = `${active}/${me}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('chat-attachments')
        .upload(path, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });
      if (upErr) throw upErr;

      // body stays null: the table's CHECK allows a message with an
      // attachment and no text.
      const { error: msgErr } = await supabase.from('messages').insert({
        conversation_id: active,
        sender_id: me,
        attachment_path: path,
      });
      if (msgErr) throw msgErr;

      qc.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err) {
      setAttachError(err instanceof Error ? err.message : 'Could not send that file.');
    } finally {
      setAttaching(false);
    }
  }

  async function saveEdit(id: string) {
    const body = editDraft.trim();
    if (!body) return;
    setEditingId(null);
    const { error } = await supabase
      .from('messages')
      .update({ body, edited_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      setAttachError(
        /edited_at|policy/i.test(error.message)
          ? 'Editing needs the edit/delete migration on this project (20260908200000_edit_delete_v1.sql).'
          : error.message,
      );
      return;
    }
    setMsgs((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, body, edited_at: new Date().toISOString() } : m,
      ),
    );
    qc.invalidateQueries({ queryKey: ['conversations'] });
  }

  async function deleteMessage(id: string) {
    setRowBusy(true);
    const { error } = await supabase.from('messages').delete().eq('id', id);
    setRowBusy(false);
    setDeletingId(null);
    if (error) {
      setAttachError(
        /policy/i.test(error.message)
          ? 'Deleting needs the edit/delete migration on this project (20260908200000_edit_delete_v1.sql).'
          : error.message,
      );
      return;
    }
    setMsgs((prev) => prev.filter((m) => m.id !== id));
    qc.invalidateQueries({ queryKey: ['conversations'] });
    qc.invalidateQueries({ queryKey: ['unread'] });
  }

  async function startWith(profileId: string) {
    setStarting(true);
    const { data: convId, error } = await supabase.rpc(
      'find_or_create_direct_conversation',
      { other_profile: profileId },
    );
    setStarting(false);
    if (error || !convId) return;
    setComposing(false);
    setSearch('');
    setHits([]);
    setActive(convId as string);
    setSearchParams({ c: convId as string });
    qc.invalidateQueries({ queryKey: ['conversations'] });
  }

  if (!isEnabled('messaging'))
    return <p className="text-muted">Messaging is turned off.</p>;

  return (
    <div className="flex h-[70vh] gap-4">
      <aside className="w-64 shrink-0 overflow-y-auto rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b p-3 font-semibold text-heading">
          <span>Messages</span>
          <button
            onClick={() => setComposing((v) => !v)}
            className="rounded-full bg-magenta px-2 py-0.5 text-xs font-medium text-white"
          >
            {composing ? 'Cancel' : '+ New'}
          </button>
        </div>

        {composing && (
          <div className="flex gap-1 border-b border-line px-3 pt-3">
            {(['direct', 'group'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setComposeMode(m)}
                className={`rounded-t-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  composeMode === m
                    ? 'bg-surface-2 text-heading'
                    : 'text-muted hover:text-heading'
                }`}
              >
                {m === 'direct' ? 'One person' : 'Group'}
              </button>
            ))}
          </div>
        )}

        {composing && composeMode === 'group' && (
          <NewGroupThread
            onCancel={() => setComposing(false)}
            onCreated={(id) => {
              setComposing(false);
              setActive(id);
              setSearchParams({ c: id });
              qc.invalidateQueries({ queryKey: ['conversations'] });
            }}
          />
        )}

        {composing && composeMode === 'direct' && (
          <div className="border-b p-3">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members…"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-magenta"
            />
            <div className="mt-2 space-y-1">
              {search.trim().length >= 2 && hits.length === 0 && (
                <p className="text-xs text-faint">No members found.</p>
              )}
              {hits.map((h) => (
                <button
                  key={h.id}
                  disabled={starting}
                  onClick={() => startWith(h.id)}
                  className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-surface-2 disabled:opacity-50"
                >
                  {h.display_name || h.first_name || 'Member'}
                </button>
              ))}
            </div>
          </div>
        )}

        {(convos.data ?? []).map((c) => {
          const others = othersOf(c, meId);
          return (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`flex w-full items-center gap-2.5 border-b border-line px-3 py-2 text-left text-sm ${
                active === c.id ? 'bg-surface-2' : ''
              }`}
            >
              {/* Two overlapping avatars stand in for a group: enough to read
                  as "more than one person" at a glance without pretending to
                  show the whole roster. */}
              <div className="relative shrink-0" style={{ width: c.is_group ? 34 : 28, height: 28 }}>
                <Avatar
                  path={others[0]?.avatar_path}
                  name={others[0]?.display_name || others[0]?.first_name || 'Member'}
                  size={c.is_group ? 22 : 28}
                />
                {c.is_group && others.length > 1 && (
                  <span className="absolute bottom-0 right-0 rounded-full ring-2 ring-surface">
                    <Avatar
                      path={others[1]?.avatar_path}
                      name={others[1]?.display_name || others[1]?.first_name || 'Member'}
                      size={18}
                    />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{convTitle(c, meId)}</div>
                <div className="truncate text-xs text-faint">
                  {c.last_message_body ?? 'No messages yet'}
                </div>
              </div>
            </button>
          );
        })}
      </aside>

      <section className="flex flex-1 flex-col rounded-2xl border border-line bg-surface">
        {!active ? (
          <div className="grid flex-1 place-items-center text-faint">
            Select a conversation or start a new one
          </div>
        ) : (
          <>
            {activeConv && (
              <ThreadHeader
                conversationId={activeConv.id}
                title={convTitle(activeConv, meId)}
                isGroup={activeConv.is_group}
                isCommunityGroup={activeConv.group_id !== null}
                meId={meId}
                members={othersOf(activeConv, meId).concat(
                  activeConv.members
                    .map((m) => m.profile)
                    .filter((p) => p.id === meId),
                )}
                onLeft={() => {
                  setActive(null);
                  setSearchParams({});
                  qc.invalidateQueries({ queryKey: ['conversations'] });
                }}
              />
            )}
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {msgs.map((m, i) => {
                const mine = m.sender_id === meId;
                // A date separator whenever the day changes, so a thread that
                // spans weeks does not read as one continuous conversation.
                const showDate =
                  i === 0 || !sameDay(msgs[i - 1].created_at, m.created_at);
                // In a group, "who said that" is a real question. Attribute an
                // incoming message whenever the sender changes, or after a
                // date break; a run from one person stays uncluttered.
                const sender = senderById.get(m.sender_id);
                const showSender =
                  !!activeConv?.is_group &&
                  !mine &&
                  (showDate || i === 0 || msgs[i - 1].sender_id !== m.sender_id);
                return (
                  <div key={m.id}>
                    {showDate && (
                      <div className="my-3 flex items-center gap-3">
                        <span className="h-px flex-1 bg-line" />
                        <span className="text-[11px] text-faint">
                          {dayLabel(m.created_at)}
                        </span>
                        <span className="h-px flex-1 bg-line" />
                      </div>
                    )}

                    {showSender && (
                      <div className="mb-0.5 ml-1 flex items-center gap-1.5">
                        <Avatar
                          path={sender?.avatar_path}
                          name={sender?.display_name || sender?.first_name || 'Member'}
                          size={18}
                        />
                        <span className="text-[11px] text-faint">
                          {sender?.display_name || sender?.first_name || 'Member'}
                        </span>
                      </div>
                    )}

                    <div className={'group flex items-end gap-1.5 ' + (mine ? 'justify-end' : '')}>
                      {/* Controls sit outside the bubble and appear on hover,
                          so they never cover the message text. */}
                      {mine && editingId !== m.id && (
                        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          {m.body && (
                            <button
                              onClick={() => {
                                setEditingId(m.id);
                                setEditDraft(m.body ?? '');
                              }}
                              aria-label="Edit message"
                              className="grid h-7 w-7 place-items-center rounded-full text-faint hover:bg-surface-2 hover:text-heading"
                            >
                              <IconPencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeletingId(m.id)}
                            aria-label="Delete message"
                            className="grid h-7 w-7 place-items-center rounded-full text-faint hover:bg-surface-2 hover:text-danger"
                          >
                            <IconTrash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      <div
                        className={`max-w-[75%] space-y-1.5 rounded-2xl px-3 py-2 text-sm ${
                          mine ? 'bg-magenta text-white' : 'bg-surface-2'
                        }`}
                      >
                        {m.attachment_path && (
                          <MessageAttachment path={m.attachment_path} mine={mine} />
                        )}

                        {editingId === m.id ? (
                          <div className="space-y-1.5">
                            <textarea
                              autoFocus
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              rows={2}
                              className="w-full resize-none rounded-lg border border-line-strong bg-surface px-2 py-1 text-sm text-heading outline-none"
                            />
                            <div className="flex justify-end gap-2 text-xs">
                              <button
                                onClick={() => setEditingId(null)}
                                className={mine ? 'text-white/80 hover:text-white' : 'text-muted'}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveEdit(m.id)}
                                disabled={!editDraft.trim()}
                                className="font-semibold disabled:opacity-50"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          m.body && <p className="whitespace-pre-wrap">{m.body}</p>
                        )}

                        <div
                          className={
                            'text-[10px] ' + (mine ? 'text-white/60' : 'text-faint')
                          }
                        >
                          {timeLabel(m.created_at)}
                          {m.edited_at && ' · edited'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            <div className="border-t border-line p-3">
              {attachError && (
                <p className="mb-2 text-sm text-danger">{attachError}</p>
              )}
              <div className="flex gap-2">
                <label
                  title="Attach a photo, video or file"
                  className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border border-line text-muted transition-colors hover:border-magenta hover:text-magenta-text"
                >
                  {attaching ? (
                    <span className="text-[10px]">…</span>
                  ) : (
                    <span aria-hidden="true">📎</span>
                  )}
                  <span className="sr-only">Attach a photo, video or file</span>
                  <input
                    type="file"
                    className="hidden"
                    disabled={attaching}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (f) void sendAttachment(f);
                    }}
                  />
                </label>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Message…"
                  className="flex-1 rounded-full border border-line px-4 py-2 text-sm outline-none focus:border-magenta"
                />
                <button
                  onClick={send}
                  className="rounded-full bg-magenta px-4 py-2 text-sm font-medium text-white"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete this message?"
        body="It will be removed for everyone in the conversation. This cannot be undone."
        confirmLabel="Delete"
        destructive
        busy={rowBusy}
        onConfirm={() => deletingId && deleteMessage(deletingId)}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
