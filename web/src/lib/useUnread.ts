import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

// Unread badges for Messages and Notifications.
//
// Neither count can be read directly from the client. Notifications are close
// (read_at is null) but unread MESSAGES need a join between messages and the
// caller's own conversation_members.last_read_at, and a member cannot select
// rows for conversations they do not belong to. One self-scoped function
// returns both.
//
// Polled rather than realtime-subscribed: two numbers in a nav bar do not
// justify a websocket, and a 60s refresh with a refetch on window focus is
// what people actually notice.
export type Unread = { notifications: number; messages: number };

export function useUnread() {
  return useQuery<Unread>({
    queryKey: ['unread'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_unread_counts');
      // Missing function means the migration has not run on this project.
      // A nav badge is not worth an error state, so fall back to zero.
      if (error) return { notifications: 0, messages: 0 };
      return (data as Unread) ?? { notifications: 0, messages: 0 };
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}
