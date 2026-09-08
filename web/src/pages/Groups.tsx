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

  const all = data ?? [];
  const myGroups = all.filter((g) => g.joined);
  const otherGroups = all.filter((g) => !g.joined);

  // One card renderer for both sections. The whole card is the link: a title
  // that is the only clickable thing in a 168px card is a small target
  // surrounded by dead space that looks clickable and is not.
  function card(g: (typeof all)[number]) {
    const cover = coverUrl(g.cover_path);
    return (
            // The cover fills the card and the content sits on top of it. A
            // scrim carries the text rather than trusting the photograph:
            // covers are member-supplied, so a bright or busy image would
            // otherwise make the name unreadable. Cards keep a minimum height
            // so a group without a cover still matches the grid.
            <Link
              key={g.id}
              to={`/groups/${g.id}`}
              className="relative isolate flex min-h-[168px] flex-col justify-end overflow-hidden rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-magenta"
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
                  <div className="font-semibold text-heading">{g.name}</div>
                  <div className="text-xs text-faint">{g.memberCount} members</div>
                  {g.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted">
                      {g.description}
                    </p>
                  )}
                </div>
                {/* Join stays a one-click action from the list. Leaving does
                    not: it lives on the group page behind a confirm, because
                    a stray click on a card should never quietly remove
                    someone from a support group. */}
                {g.joined ? (
                  <span className="shrink-0 rounded-full bg-surface-2 px-3 py-1 text-sm font-medium text-heading">
                    Joined
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      // The card is a link now; joining must not navigate.
                      e.preventDefault();
                      e.stopPropagation();
                      toggle.mutate({ id: g.id, joined: false });
                    }}
                    className="shrink-0 rounded-full bg-magenta px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-magenta-hi"
                  >
                    Join
                  </button>
                )}
              </div>
            </Link>
    );
  }

  return (
    <div>
      <PageTitle>Groups</PageTitle>

      {myGroups.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-sans text-sm font-semibold text-magenta-text">
            My groups
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">{myGroups.map(card)}</div>
        </section>
      )}

      {otherGroups.length > 0 && (
        <section>
          {/* Only worth a heading once there is something above it to
              distinguish from. A member of nothing just sees "Groups". */}
          {myGroups.length > 0 && (
            <h2 className="mb-3 font-sans text-sm font-semibold text-magenta-text">
              Groups you can join
            </h2>
          )}
          <div className="grid gap-3 sm:grid-cols-2">{otherGroups.map(card)}</div>
        </section>
      )}

      {all.length === 0 && (
        <p className="text-muted">No groups yet.</p>
      )}
    </div>
  );
}
