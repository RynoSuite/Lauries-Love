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
  cover_path: string | null;
};

// Covers live in the public 'avatars' bucket under the uploader's uid prefix,
// the same convention admin/Groups.tsx writes and create_group's p_cover_path
// expects.
function coverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl ?? null;
}

async function fetchGroups() {
  const me = await currentUserId();
  const [{ data: groups, error }, { data: counts }, { data: mine }] =
    await Promise.all([
      supabase.from('groups').select('id, name, description, tags, cover_path').order('name'),
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
        {(data ?? []).map((g) => {
          const cover = coverUrl(g.cover_path);
          return (
            // The cover fills the card and the content sits on top of it. A
            // scrim carries the text rather than trusting the photograph:
            // covers are member-supplied, so a bright or busy image would
            // otherwise make the name unreadable. Cards keep a minimum height
            // so a group without a cover still matches the grid.
            <div
              key={g.id}
              className="relative isolate flex min-h-[168px] flex-col justify-end overflow-hidden rounded-2xl border border-line bg-surface p-4"
            >
              {cover && (
                <>
                  <img
                    src={cover}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 h-full w-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 bg-gradient-to-t from-ground via-ground/80 to-ground/35"
                  />
                </>
              )}

              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to={`/groups/${g.id}`}
                    className="font-semibold text-heading hover:text-magenta-text hover:underline"
                  >
                    {g.name}
                  </Link>
                  <div className="text-xs text-faint">{g.memberCount} members</div>
                  {g.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted">
                      {g.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggle.mutate({ id: g.id, joined: g.joined })}
                  className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${
                    g.joined ? 'bg-surface-2 text-heading' : 'bg-magenta text-white'
                  }`}
                >
                  {g.joined ? 'Joined' : 'Join'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
