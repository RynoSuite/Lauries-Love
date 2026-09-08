import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { PageTitle } from '../../components/PageTitle';
import { ConfirmDialog } from '../../components/ConfirmDialog';

// Moderation review queue.
//
// Two things were wrong here and both mattered. Rejecting an item only updated
// the queue row: the reported post stayed visible to everyone while the page
// claimed "reject to remove it". And the queue showed an entity id rather than
// the reported text, so a moderator decided blind on content they had to go
// and find elsewhere.
//
// Now the text and its author are shown, and reject genuinely deletes.

type QueueItem = {
  id: string;
  entity_type: 'post' | 'comment';
  entity_id: string;
  reason: string | null;
  score: number | null;
  status: string;
  created_at: string;
  content: string | null;
  author_id: string | null;
  author_name: string | null;
  content_exists: boolean;
  // Null on older deployments where the SQL function predates this column.
  post_id?: string | null;
};

async function fetchQueue(): Promise<QueueItem[]> {
  const { data, error } = await supabase.rpc('moderation_queue_detailed', {
    p_limit: 100,
  });
  if (error) throw error;
  return (data ?? []) as QueueItem[];
}

export function AdminModeration() {
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState<QueueItem | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ['modqueue'],
    queryFn: fetchQueue,
  });

  const resolve = useMutation({
    mutationFn: async (v: { id: string; action: 'approve' | 'reject' }) => {
      const { error: e } = await supabase.rpc('moderation_resolve', {
        p_queue_id: v.id,
        p_action: v.action,
      });
      if (e) {
        if (/moderation_resolve|function/i.test(e.message)) {
          throw new Error(
            'The moderation functions are not installed on this project. Run supabase/migrations/20260908220000_moderation_resolve_v1.sql, then reload.',
          );
        }
        throw e;
      }
    },
    onSuccess: () => {
      setConfirming(null);
      qc.invalidateQueries({ queryKey: ['modqueue'] });
      qc.invalidateQueries({ queryKey: ['admin-counts'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const migrationMissing =
    error && /moderation_queue_detailed|function/i.test((error as Error).message);

  return (
    <div className="max-w-3xl">
      <PageTitle>Moderation queue</PageTitle>
      <p className="mb-4 text-sm text-muted">
        Content members have reported, and anything the automatic check flagged.
        Keeping it dismisses the report; removing it deletes the content for
        everyone.
      </p>

      {migrationMissing && (
        <p className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          The moderation functions are not installed on this project. Run
          supabase/migrations/20260908220000_moderation_resolve_v1.sql, then reload.
        </p>
      )}
      {error && !migrationMissing && (
        <p className="mb-4 text-sm text-danger">{(error as Error).message}</p>
      )}
      {resolve.isError && (
        <p className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {(resolve.error as Error).message}
        </p>
      )}

      {isLoading && <p className="text-heading">Loading…</p>}
      {data && data.length === 0 && !error && (
        <p className="text-muted">Nothing waiting for review.</p>
      )}

      <div className="space-y-3">
        {(data ?? []).map((q) => (
          <div key={q.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded bg-surface-2 px-2 py-0.5 font-semibold text-muted">
                {q.entity_type}
              </span>
              {q.author_name && (
                <span className="text-muted">by {q.author_name}</span>
              )}
              <span className="text-faint">
                {new Date(q.created_at).toLocaleString()}
              </span>
              {q.score != null && (
                <span className="text-faint">score {Number(q.score).toFixed(2)}</span>
              )}
            </div>

            {q.reason && (
              <p className="mb-2 text-sm text-warn">Reported for: {q.reason}</p>
            )}

            {/* The reported text itself. Judging a report without reading what
                was said is not moderation. */}
            {q.content_exists ? (
              <blockquote className="rounded-lg border-l-2 border-magenta bg-surface-2 px-3 py-2 text-sm text-body">
                <p className="whitespace-pre-wrap">{q.content || '(no text)'}</p>
              </blockquote>
            ) : (
              <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-faint">
                This content has already been deleted.
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => resolve.mutate({ id: q.id, action: 'approve' })}
                disabled={resolve.isPending}
                className="rounded-lg border border-line px-3 py-1.5 text-sm text-body transition-colors hover:border-success hover:text-success disabled:opacity-50"
              >
                Keep it
              </button>
              <button
                onClick={() => setConfirming(q)}
                disabled={resolve.isPending || !q.content_exists}
                className="rounded-lg bg-danger px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-danger-hi disabled:opacity-50"
              >
                Remove it
              </button>
              {/* Straight to the post itself, and for a reported comment to
                  the post it hangs under, so the moderator sees the exchange
                  in context. Opens in a new tab: judging one report should not
                  cost you your place in the queue. */}
              {q.content_exists && q.post_id && (
                <a
                  href={`/posts/${q.post_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="self-center text-sm text-magenta-text hover:underline"
                >
                  {q.entity_type === 'comment' ? 'View in context' : 'View post'}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirming !== null}
        title={`Remove this ${confirming?.entity_type ?? 'content'}?`}
        body={
          confirming?.entity_type === 'post'
            ? 'The post and all of its comments will be deleted for everyone. This cannot be undone.'
            : 'The comment will be deleted for everyone. This cannot be undone.'
        }
        confirmLabel="Remove it"
        destructive
        busy={resolve.isPending}
        onConfirm={() =>
          confirming && resolve.mutate({ id: confirming.id, action: 'reject' })
        }
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
