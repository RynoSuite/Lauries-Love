import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, currentUserId } from '../lib/supabase';
import { useFeatureFlags } from '../lib/featureFlags';
import { PageTitle } from '../components/PageTitle';

type Group = {
  id: string;
  name: string;
  description: string | null;
  tags: string[] | null;
};

async function fetchGroups() {
  const me = await currentUserId();
  const [{ data: groups, error }, { data: counts }, { data: mine }] =
    await Promise.all([
      supabase.from('groups').select('id, name, description, tags').order('name'),
      supabase.rpc('group_member_counts'),
      me
        ? supabase.from('group_members').select('group_id').eq('profile_id', me)
        : Promise.resolve({ data: [] as { group_id: string }[] }),
    ]);
  if (error) throw error;
  const countBy: Record<string, number> = {};
  (counts ?? []).forEach((r: { group_id: string; member_count: number }) => {
    countBy[r.group_id] = Number(r.member_count) || 0;
  });
  const joined = new Set((mine ?? []).map((r) => r.group_id));
  return (groups ?? []).map((g: Group) => ({
    ...g,
    memberCount: countBy[g.id] ?? 0,
    joined: joined.has(g.id),
  }));
}

export function Groups() {
  const { isEnabled } = useFeatureFlags();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups });

  const toggle = useMutation({
    mutationFn: async (v: { id: string; joined: boolean }) => {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      if (v.joined) {
        await supabase
          .from('group_members')
          .delete()
          .eq('group_id', v.id)
          .eq('profile_id', me);
      } else {
        const { error } = await supabase
          .from('group_members')
          .insert({ group_id: v.id, profile_id: me });
        if (error && error.code !== '23505') throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });

  if (!isEnabled('groups'))
    return <p className="text-muted">Groups are turned off.</p>;
  if (isLoading) return <p className="text-heading">Loading groups…</p>;

  return (
    <div>
      <PageTitle>Groups</PageTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {(data ?? []).map((g) => (
          <div key={g.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link to={`/groups/${g.id}`} className="font-semibold hover:text-magenta-text hover:underline">
                  {g.name}
                </Link>
                <div className="text-xs text-faint">{g.memberCount} members</div>
              </div>
              <button
                onClick={() => toggle.mutate({ id: g.id, joined: g.joined })}
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  g.joined
                    ? 'bg-surface-2 text-heading'
                    : 'bg-magenta text-white'
                }`}
              >
                {g.joined ? 'Joined' : 'Join'}
              </button>
            </div>
            {g.description && (
              <p className="mt-2 text-sm text-muted">{g.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
