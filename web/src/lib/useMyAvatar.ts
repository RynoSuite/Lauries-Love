import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, currentUserId } from './supabase';

// The signed-in member's own avatar + name, shared by the header chip and the
// profile page. One query key so that uploading a photo on Profile refreshes
// the header chip immediately — without this they drift until a page reload.
export const MY_AVATAR_KEY = ['my-avatar'] as const;

type MyAvatar = {
  avatar_path: string | null;
  display_name: string | null;
  first_name: string | null;
} | null;

export function useMyAvatar() {
  return useQuery<MyAvatar>({
    queryKey: MY_AVATAR_KEY,
    queryFn: async () => {
      const me = await currentUserId();
      if (!me) return null;
      const { data } = await supabase
        .from('profiles')
        .select('avatar_path, display_name, first_name')
        .eq('id', me)
        .maybeSingle();
      return (data as MyAvatar) ?? null;
    },
    staleTime: 60_000,
  });
}

// Call after changing the avatar so every surface picks it up.
export function useRefreshMyAvatar() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: MY_AVATAR_KEY });
    void qc.invalidateQueries({ queryKey: ['my-profile'] });
    void qc.invalidateQueries({ queryKey: ['feed'] });
  };
}
