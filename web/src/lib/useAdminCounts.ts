import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useAuth } from './auth';

// Pending work counts for the admin console.
//
// Reporting a post writes to moderation_queue and notifies nobody, so the only
// way a moderator learned a report existed was to open the page and look. In a
// cancer-support community a report can be someone in crisis, and "we saw it
// next time we happened to check" is not good enough.
//
// These are head-only count queries, so nothing but a number crosses the wire.
// Staff can already select both tables, so no new function or policy is needed.
export type AdminCounts = { moderation: number; tickets: number };

export function useAdminCounts() {
  const { isStaff } = useAuth();
  return useQuery<AdminCounts>({
    queryKey: ['admin-counts'],
    enabled: isStaff,
    queryFn: async () => {
      const [mod, tix] = await Promise.all([
        supabase
          .from('moderation_queue')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('support_tickets')
          .select('id', { count: 'exact', head: true })
          .neq('status', 'closed'),
      ]);
      return { moderation: mod.count ?? 0, tickets: tix.count ?? 0 };
    },
    // Polled so a moderator sitting on any page sees a report arrive without
    // navigating. A minute is frequent enough to matter and cheap enough to
    // ignore: two counts, no rows.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}
