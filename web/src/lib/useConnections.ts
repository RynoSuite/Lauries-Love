import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

// The signed-in member's accepted connections, for the group-thread picker.
//
// Comes from an RPC rather than a client-side join because friendships holds
// both directions in one table and the "other person" is whichever column is
// not you. The function also keeps the payload to what a picker needs: name
// and avatar, no email, no location, no diagnosis.
export type Connection = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  avatar_path: string | null;
};

export function connectionName(c: Connection) {
  return c.display_name || c.first_name || 'Member';
}

export function useConnections(enabled = true) {
  return useQuery<Connection[]>({
    queryKey: ['my-connections'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_connections');
      if (error) throw error;
      return (data ?? []) as Connection[];
    },
    enabled,
    staleTime: 60_000,
  });
}
