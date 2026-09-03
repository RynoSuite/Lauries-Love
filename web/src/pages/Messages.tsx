import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, currentUserId } from '../lib/supabase';
import { useFeatureFlags } from '../lib/featureFlags';

type Conversation = {
  id: string;
  is_group: boolean;
  name: string | null;
  last_message_body: string | null;
  last_message_at: string | null;
  members: { profile: { id: string; display_name: string | null; first_name: string | null } }[];
};
type Message = {
  id: string;
  body: string | null;
  sender_id: string;
  created_at: string;
};
type MemberHit = {
  id: string;
  display_name: string | null;
  first_name: string | null;
};

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
      'id, is_group, name, last_message_body, last_message_at, members:conversation_members(profile:profiles(id, display_name, first_name))',
    )
    .in('id', ids)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  return (data ?? []) as unknown as Conversation[];
}

function convTitle(c: Conversation, meId: string | null) {
  if (c.name) return c.name;
  const others = c.members
    .map((m) => m.profile)
    .filter((p) => p.id !== meId)
    .map((p) => p.display_name || p.first_name || 'Member');
  return others.join(', ') || 'Conversation';
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
  const [search, setSearch] = useState('');
  const [hits, setHits] = useState<MemberHit[]>([]);
  const [starting, setStarting] = useState(false);

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
      .select('id, body, sender_id, created_at')
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

  async function send() {
    if (!text.trim() || !active) return;
    const me = await currentUserId();
    const body = text.trim();
    setText('');
    await supabase.from('messages').insert({ conversation_id: active, sender_id: me, body });
    qc.invalidateQueries({ queryKey: ['conversations'] });
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

        {(convos.data ?? []).map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className={`block w-full border-b px-3 py-2 text-left text-sm ${
              active === c.id ? 'bg-surface-2' : ''
            }`}
          >
            <div className="font-medium">{convTitle(c, meId)}</div>
            <div className="truncate text-xs text-faint">
              {c.last_message_body ?? 'No messages yet'}
            </div>
          </button>
        ))}
      </aside>

      <section className="flex flex-1 flex-col rounded-2xl border border-line bg-surface">
        {!active ? (
          <div className="grid flex-1 place-items-center text-faint">
            Select a conversation or start a new one
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {msgs.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    m.sender_id === meId
                      ? 'ml-auto bg-magenta text-white'
                      : 'bg-surface-2'
                  }`}
                >
                  {m.body}
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="flex gap-2 border-t p-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
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
          </>
        )}
      </section>
    </div>
  );
}
