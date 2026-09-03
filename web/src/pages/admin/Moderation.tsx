import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { currentUserId } from '../../lib/supabase';
import { PageTitle } from '../../components/PageTitle';

// AI-moderation review queue. An edge function on post/comment insert flags
// suspect content into moderation_queue; staff approve or reject here. The AI
// flags, a human decides — the SOW's human-in-the-loop requirement.
type QueueItem = {
  id: string;
  entity_type: 'post' | 'comment';
  entity_id: string;
  reason: string | null;
  score: number | null;
  flagged_by: string;
  status: string;
  created_at: string;
};

async function fetchQueue(): Promise<QueueItem[]> {
  const { data, error } = await supabase
    .from('moderation_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export function AdminModeration() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['modqueue'],
    queryFn: fetchQueue,
  });

  const review = useMutation({
    mutationFn: async (v: { id: string; status: 'approved' | 'rejected' }) => {
      const me = await currentUserId();
      const { error } = await supabase
        .from('moderation_queue')
        .update({
          status: v.status,
          reviewed_by: me,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', v.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modqueue'] }),
  });

  return (
    <div>
      <PageTitle>Moderation queue</PageTitle>
      <p className="mb-4 text-sm text-muted">
        Content flagged for review. Approve to keep it, reject to remove it.
      </p>
      {isLoading && <p className="text-heading">Loading…</p>}
      {data && data.length === 0 && (
        <p className="text-muted">Nothing waiting for review. 🎉</p>
      )}
      <div className="space-y-3">
        {(data ?? []).map((q) => (
          <div
            key={q.id}
            className="rounded-xl border border-line bg-surface-2 p-4"
          >
            <div className="mb-2 flex items-center gap-2 text-xs text-muted">
              <span className="rounded bg-surface px-2 py-0.5 font-semibold">
                {q.entity_type}
              </span>
              <span>flagged by {q.flagged_by}</span>
              {q.score != null && <span>· score {q.score.toFixed(2)}</span>}
              <span>· {new Date(q.created_at).toLocaleString()}</span>
            </div>
            {q.reason && <p className="mb-3 text-sm">{q.reason}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => review.mutate({ id: q.id, status: 'approved' })}
                className="rounded-lg bg-success px-3 py-1 text-sm font-medium text-white"
              >
                Approve
              </button>
              <button
                onClick={() => review.mutate({ id: q.id, status: 'rejected' })}
                className="rounded-lg bg-danger px-3 py-1 text-sm font-medium text-white"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
