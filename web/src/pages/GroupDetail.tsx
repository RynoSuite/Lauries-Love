import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, currentUserId } from '../lib/supabase';
import { useFeatureFlags } from '../lib/featureFlags';
import { IconComment, IconHeart, IconHeartFilled } from '../components/Icons';
import { Avatar } from '../components/Avatar';

// Covers live in the public 'avatars' bucket under the uploader's uid prefix.
function coverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl ?? null;
}


// A single group: info, members, and a group-scoped feed (visibility='group').
// RLS shows group posts only to members; the composer is shown only to members.
type Member = { id: string; display_name: string | null; first_name: string | null; avatar_path: string | null };
type GroupPost = {
  id: string;
  body: string;
  created_at: string;
  like_count: number;
  author: { id: string; first_name: string | null; display_name: string | null; avatar_path: string | null } | null;
  comments: { count: number }[];
};

async function fetchGroup(id: string) {
  const me = await currentUserId();
  const [{ data: group, error }, members, mine] = await Promise.all([
    supabase.from('groups').select('id, name, description, cover_path').eq('id', id).maybeSingle(),
    supabase
      .from('group_members')
      .select('profile:profiles(id, display_name, first_name, avatar_path)')
      .eq('group_id', id),
    me
      ? supabase.from('group_members').select('group_id').eq('group_id', id).eq('profile_id', me).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (error || !group) return null;
  const memberList = ((members.data ?? []) as unknown as { profile: Member }[]).map(
    (r) => r.profile,
  );
  return { ...group, members: memberList, joined: !!mine.data };
}

async function fetchGroupPosts(id: string): Promise<{ posts: GroupPost[]; likedIds: Set<string> }> {
  const { data } = await supabase
    .from('posts')
    .select(
      'id, body, created_at, like_count, author:profiles!posts_author_id_fkey(id, first_name, display_name, avatar_path), comments(count)',
    )
    .eq('group_id', id)
    .eq('visibility', 'group')
    .order('created_at', { ascending: false })
    .limit(50);
  const posts = (data ?? []) as unknown as GroupPost[];
  const me = await currentUserId();
  let likedIds = new Set<string>();
  if (me && posts.length) {
    const { data: likes } = await supabase
      .from('reactions')
      .select('entity_id')
      .eq('entity_type', 'post')
      .eq('user_id', me)
      .eq('kind', 'like')
      .in('entity_id', posts.map((p) => p.id));
    likedIds = new Set((likes ?? []).map((r: { entity_id: string }) => r.entity_id));
  }
  return { posts, likedIds };
}

export function GroupDetail() {
  const { id = '' } = useParams();
  const { isEnabled } = useFeatureFlags();
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const [commentFor, setCommentFor] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState('');

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => fetchGroup(id),
    enabled: !!id,
  });
  const { data: feed } = useQuery({
    queryKey: ['group-posts', id],
    queryFn: () => fetchGroupPosts(id),
    enabled: !!id,
  });

  const toggleJoin = useMutation({
    mutationFn: async (joined: boolean) => {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      if (joined) {
        await supabase.from('group_members').delete().eq('group_id', id).eq('profile_id', me);
      } else {
        const { error } = await supabase.from('group_members').insert({ group_id: id, profile_id: me });
        if (error && error.code !== '23505') throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group', id] });
      qc.invalidateQueries({ queryKey: ['group-posts', id] });
    },
  });

  const createPost = useMutation({
    mutationFn: async (text: string) => {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      const { error } = await supabase
        .from('posts')
        .insert({ author_id: me, body: text.trim(), visibility: 'group', group_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['group-posts', id] });
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (v: { id: string; liked: boolean }) => {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      if (v.liked) {
        await supabase.from('reactions').delete().eq('entity_type', 'post').eq('entity_id', v.id).eq('user_id', me).eq('kind', 'like');
      } else {
        const { error } = await supabase.from('reactions').insert({ entity_type: 'post', entity_id: v.id, user_id: me, kind: 'like' });
        if (error && error.code !== '23505') throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['group-posts', id] }),
  });

  const addComment = useMutation({
    mutationFn: async (v: { postId: string; text: string }) => {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      const { error } = await supabase.from('comments').insert({ post_id: v.postId, author_id: me, body: v.text.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setCommentBody('');
      setCommentFor(null);
      qc.invalidateQueries({ queryKey: ['group-posts', id] });
    },
  });

  if (!isEnabled('groups')) return <p className="text-muted">Groups are turned off.</p>;
  if (isLoading) return <p className="text-heading">Loading…</p>;
  if (!group) return <p className="text-muted">Group not found.</p>;

  const posts = feed?.posts ?? [];
  const likedIds = feed?.likedIds ?? new Set<string>();

  return (
    <div className="space-y-4">
      <Link to="/groups" className="text-sm text-heading hover:underline">
        ← All groups
      </Link>

      {/* Same treatment as the group cards: the cover fills the header and a
          scrim carries the text, since covers are member-supplied and a bright
          image would otherwise swallow the name. */}
      <div className="relative isolate flex min-h-[190px] flex-col justify-end overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-sm">
        {coverUrl(group.cover_path) && (
          <>
            <img
              src={coverUrl(group.cover_path) ?? undefined}
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
            <h1 className="text-xl font-bold text-heading">{group.name}</h1>
            <div className="text-xs text-faint">{group.members.length} members</div>
            {group.description && (
              <p className="mt-1.5 text-sm text-muted">{group.description}</p>
            )}
          </div>
          <button
            onClick={() => toggleJoin.mutate(group.joined)}
            disabled={toggleJoin.isPending}
            className={`shrink-0 rounded-full px-4 py-1 text-sm font-medium ${
              group.joined ? 'bg-surface-2 text-heading' : 'bg-magenta text-white'
            }`}
          >
            {group.joined ? 'Joined' : 'Join'}
          </button>
        </div>

        {group.members.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
            {group.members.slice(0, 12).map((m) => {
              const nm = m.display_name || m.first_name || 'Member';
              return (
                <Link
                  key={m.id}
                  to={`/users/${m.id}`}
                  className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-xs text-heading hover:bg-surface-2"
                >
                  <Avatar path={m.avatar_path} name={nm} size={16} />
                  {nm}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {group.joined && (
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Share something with ${group.name}…`}
            rows={2}
            className="w-full resize-none rounded-lg border border-line p-3 text-sm outline-none focus:border-magenta"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => createPost.mutate(body)}
              disabled={!body.trim() || createPost.isPending}
              className="rounded-lg bg-magenta px-4 py-2 text-sm font-semibold text-white hover:bg-magenta-hi disabled:opacity-50"
            >
              {createPost.isPending ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {posts.length === 0 && (
        <p className="text-sm text-muted">
          {group.joined ? 'No posts yet, start the conversation.' : 'Join to see and share posts in this group.'}
        </p>
      )}

      {posts.map((p) => {
        const name = p.author?.display_name || p.author?.first_name || 'Member';
        const liked = likedIds.has(p.id);
        return (
          <article key={p.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <header className="mb-2 flex items-center gap-3">
              <Avatar path={p.author?.avatar_path} name={name} size={36} />
              <div>
                {p.author?.id ? (
                  <Link to={`/users/${p.author.id}`} className="text-sm font-semibold hover:text-magenta-text hover:underline">
                    {name}
                  </Link>
                ) : (
                  <div className="text-sm font-semibold">{name}</div>
                )}
                <div className="text-xs text-faint">{new Date(p.created_at).toLocaleDateString()}</div>
              </div>
            </header>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{p.body}</p>
            <footer className="mt-3 flex gap-4 text-sm text-muted">
              <button
                onClick={() => toggleLike.mutate({ id: p.id, liked })}
                disabled={toggleLike.isPending}
                className={`flex items-center gap-1.5 transition-colors ${liked ? 'font-semibold text-magenta' : 'hover:text-magenta-text'}`}
              >
                {liked ? (
                  <IconHeartFilled className="h-[17px] w-[17px]" />
                ) : (
                  <IconHeart className="h-[17px] w-[17px]" />
                )}
                {p.like_count}
              </button>
              <button
                onClick={() => setCommentFor((c) => (c === p.id ? null : p.id))}
                className="flex items-center gap-1.5 transition-colors hover:text-magenta-text"
              >
                <IconComment className="h-[17px] w-[17px]" />
                {p.comments?.[0]?.count ?? 0}
              </button>
            </footer>
            {commentFor === p.id && (
              <div className="mt-3 flex gap-2">
                <input
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Write a comment…"
                  className="flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-magenta"
                />
                <button
                  onClick={() => addComment.mutate({ postId: p.id, text: commentBody })}
                  disabled={!commentBody.trim() || addComment.isPending}
                  className="rounded-lg bg-magenta px-3 py-2 text-sm font-semibold text-white hover:bg-magenta-hi disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
