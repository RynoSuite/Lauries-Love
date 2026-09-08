import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, currentUserId } from '../lib/supabase';
import { useFeatureFlags } from '../lib/featureFlags';
import { PageTitle } from '../components/PageTitle';

// In-app notifications for the signed-in member. Reads the notifications table
// (RLS: recipient-only). Push delivery is a separate edge function (send-push);
// this is the in-app inbox. Clicking a notification marks it read and jumps to
// the relevant place (a conversation, a member's profile, or the feed).
type Note = {
  id: string;
  entity_type: string;
  sender_id: string | null;
  content: string | null;
  meta: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

async function fetchNotes(): Promise<Note[]> {
  const me = await currentUserId();
  if (!me) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('id, entity_type, sender_id, content, meta, read_at, created_at')
    .eq('recipient_id', me)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as Note[];
}

const LABEL: Record<string, string> = {
  POST_REACTION: 'New like',
  POST_COMMENT: 'New comment',
  NEW_MENTION: 'Mention',
  MESSAGE: 'New message',
  FRIEND_REQUEST: 'Friend request',
  FRIEND_ACCEPT: 'Friend request accepted',
  WELCOME: 'Welcome to Laurie’s Love',
};

function targetFor(n: Note): string | null {
  switch (n.entity_type) {
    case 'MESSAGE': {
      const c = n.meta?.conversationId;
      return c ? `/messages?c=${c}` : '/messages';
    }
    case 'FRIEND_REQUEST':
    case 'FRIEND_ACCEPT':
      return n.sender_id ? `/users/${n.sender_id}` : null;
    case 'POST_REACTION':
    case 'POST_COMMENT':
    case 'NEW_MENTION': {
      // The triggers store postId (and commentId for a comment like). Fall
      // back to the feed for older rows written before permalinks existed.
      const p = n.meta?.postId;
      return typeof p === 'string' ? `/posts/${p}` : '/';
    }
    default:
      return null;
  }
}

export function Notifications() {
  const { isEnabled } = useFeatureFlags();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: fetchNotes });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      // Without this the bell badge kept its count until the 60s poll.
      qc.invalidateQueries({ queryKey: ['unread'] });
    },
  });

  // Opening this page IS reading the notifications, so the bell clears here
  // rather than only when each row is clicked. Messages deliberately do not
  // work this way: a thread is only read when you open that thread.
  //
  // The ids that were unread on arrival are remembered so the highlight
  // survives the write. Clearing the badge should not also erase the visual
  // answer to "what is new since last time" while you are still looking at it.
  // State, not a ref: the highlight has to survive into a render, and a ref
  // written in an effect never triggers one.
  const [wasUnread, setWasUnread] = useState<Set<string> | null>(null);
  const cleared = useRef(false);
  useEffect(() => {
    if (!data || cleared.current) return;
    cleared.current = true;
    const ids = data.filter((n) => !n.read_at).map((n) => n.id);
    setWasUnread(new Set(ids));
    if (ids.length === 0) return;
    void supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', ids)
      .then(() => qc.invalidateQueries({ queryKey: ['unread'] }));
  }, [data, qc]);

  function open(n: Note) {
    if (!n.read_at) markRead.mutate(n.id);
    const to = targetFor(n);
    if (to) navigate(to);
  }

  if (!isEnabled('notifications'))
    return <p className="text-muted">Notifications are turned off.</p>;
  if (isLoading) return <p className="text-heading">Loading…</p>;

  return (
    <div className="mx-auto max-w-lg">
      <PageTitle>Notifications</PageTitle>
      {data && data.length === 0 && (
        <p className="text-muted">You’re all caught up.</p>
      )}
      <div className="space-y-2">
        {(data ?? []).map((n) => (
          <button
            key={n.id}
            onClick={() => open(n)}
            className={`block w-full rounded-xl border p-3 text-left text-sm ${
              wasUnread?.has(n.id)
                ? 'border-line bg-surface-2'
                : 'border-line bg-surface'
            }`}
          >
            <div className="font-medium text-heading">
              {LABEL[n.entity_type] ?? n.entity_type}
            </div>
            {n.content && <div className="text-muted">{n.content}</div>}
            <div className="mt-1 text-xs text-faint">
              {new Date(n.created_at).toLocaleString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
