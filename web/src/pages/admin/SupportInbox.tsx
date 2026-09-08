import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, currentUserId } from '../../lib/supabase';
import { PageTitle } from '../../components/PageTitle';
import { Avatar } from '../../components/Avatar';

// Support inbox. Staff read every ticket, set its status, and reply.
//
// A reply opens (or reuses) a direct conversation with the member and posts
// there, so the answer arrives in Messages, where the member already looks and
// where realtime and push already work. Before this, the inbox could only
// change a status: a member could write in and there was no way, on any
// surface, to answer them.

type Ticket = {
  id: string;
  user_id: string;
  category: string | null;
  subject: string;
  description: string | null;
  status: string;
  created_at: string;
  conversation_id: string | null;
  author: {
    display_name: string | null;
    first_name: string | null;
    avatar_path: string | null;
  } | null;
};

type Msg = {
  id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
};

async function fetchTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select(
      'id, user_id, category, subject, description, status, created_at, conversation_id, author:profiles!support_tickets_user_id_fkey(display_name, first_name, avatar_path)',
    )
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as Ticket[];
}

async function fetchThread(conversationId: string): Promise<Msg[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as Msg[];
}

// A ticket is either waiting on us or it is done. "In progress" sounds useful
// and in practice becomes a third state nobody updates, so it is not offered.
// The database CHECK still permits it, so any existing in_progress row is
// shown correctly and moves to open or closed on the next change.
const STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];
const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  closed: 'Closed',
};

function Thread({ conversationId, meId }: { conversationId: string; meId: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ['ticket-thread', conversationId],
    queryFn: () => fetchThread(conversationId),
  });
  if (isLoading) return <p className="text-sm text-muted">Loading the conversation…</p>;
  if (!data?.length) return null;
  return (
    <div className="space-y-2">
      {data.map((m) => {
        const mine = m.sender_id === meId;
        return (
          <div
            key={m.id}
            className={
              'max-w-[85%] rounded-xl px-3 py-2 text-sm ' +
              (mine
                ? 'ml-auto bg-magenta text-white'
                : 'bg-surface-2 text-body')
            }
          >
            <p className="whitespace-pre-wrap">{m.body}</p>
            <div className={'mt-1 text-[11px] ' + (mine ? 'text-white/70' : 'text-faint')}>
              {mine ? 'You' : 'Member'} · {new Date(m.created_at).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AdminSupportInbox() {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const { data, isLoading, error } = useQuery({ queryKey: ['tickets'], queryFn: fetchTickets });
  const { data: meId } = useQuery({ queryKey: ['me-id'], queryFn: currentUserId });

  const setStatus = useMutation({
    mutationFn: async (v: { id: string; status: string }) => {
      const { error: e } = await supabase
        .from('support_tickets')
        .update({ status: v.status, updated_at: new Date().toISOString() })
        .eq('id', v.id);
      if (e) throw e;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });

  const send = useMutation({
    mutationFn: async (v: { ticketId: string; body: string }) => {
      const { error: e } = await supabase.rpc('support_ticket_reply', {
        p_ticket_id: v.ticketId,
        p_body: v.body,
      });
      if (e) {
        if (/support_ticket_reply|function/i.test(e.message)) {
          throw new Error(
            'The reply function is not installed on this project. Run supabase/migrations/20260908160000_support_ticket_replies_v1.sql, then reload.',
          );
        }
        throw e;
      }
    },
    onSuccess: () => {
      setReply('');
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['ticket-thread'] });
    },
  });

  const openCount = (data ?? []).filter((t) => t.status !== 'closed').length;

  return (
    <div className="max-w-3xl pb-10">
      <PageTitle>Support inbox</PageTitle>
      <p className="mb-4 text-sm text-muted">
        {openCount > 0
          ? `${openCount} ticket${openCount === 1 ? '' : 's'} waiting for a reply.`
          : 'Nothing waiting for a reply.'}{' '}
        Replies arrive in the member's Messages.
      </p>

      {error && (
        <p className="text-danger">Could not load tickets (staff access required).</p>
      )}
      {isLoading && <p className="text-heading">Loading…</p>}
      {data && data.length === 0 && <p className="text-muted">No support tickets.</p>}

      <div className="space-y-3">
        {(data ?? []).map((t) => {
          const name = t.author?.display_name || t.author?.first_name || 'Member';
          const expanded = openId === t.id;
          const closed = t.status === 'closed';
          return (
            <div
              key={t.id}
              className={
                'rounded-xl border bg-surface p-4 shadow-sm ' +
                (closed ? 'border-line opacity-70' : 'border-line')
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <Avatar path={t.author?.avatar_path} name={name} size={36} />
                  <div className="min-w-0">
                    <div className="font-semibold text-heading">{t.subject}</div>
                    <div className="text-xs text-faint">
                      {name}
                      {t.category ? ` · ${t.category}` : ''} ·{' '}
                      {new Date(t.created_at).toLocaleString()}
                    </div>
                    {t.description && !expanded && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted">
                        {t.description}
                      </p>
                    )}
                  </div>
                </div>
                <select
                  value={t.status}
                  onChange={(e) => setStatus.mutate({ id: t.id, status: e.target.value })}
                  className="shrink-0 rounded border border-line-strong px-2 py-1 text-xs"
                >
                  {/* A legacy in_progress row would otherwise have no matching
                      option and the select would render blank. */}
                  {t.status === 'in_progress' && (
                    <option value="in_progress">{STATUS_LABEL.in_progress}</option>
                  )}
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {expanded && (
                <div className="mt-4 space-y-3 border-t border-line pt-4">
                  {t.conversation_id ? (
                    <Thread conversationId={t.conversation_id} meId={meId ?? null} />
                  ) : (
                    <div className="rounded-xl bg-surface-2 px-3 py-2 text-sm text-body">
                      <p className="whitespace-pre-wrap">{t.description}</p>
                      <div className="mt-1 text-[11px] text-faint">
                        {name} · {new Date(t.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div>
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={3}
                      placeholder={`Reply to ${name}…`}
                      className="w-full resize-none rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-magenta"
                    />
                    {send.isError && (
                      <p className="mt-1 text-sm text-danger">
                        {(send.error as Error).message}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={() => send.mutate({ ticketId: t.id, body: reply })}
                        disabled={!reply.trim() || send.isPending}
                        className="rounded-lg bg-magenta px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-magenta-hi disabled:opacity-50"
                      >
                        {send.isPending ? 'Sending…' : 'Send reply'}
                      </button>
                      <span className="text-xs text-faint">
                        Goes to {name} in Messages.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setOpenId(expanded ? null : t.id);
                  setReply('');
                  send.reset();
                }}
                className="mt-3 text-sm text-magenta-text hover:underline"
              >
                {expanded ? 'Close' : t.conversation_id ? 'Open conversation' : 'Reply'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
