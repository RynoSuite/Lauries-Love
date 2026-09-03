import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, currentUserId } from '../lib/supabase';
import { useFeatureFlags } from '../lib/featureFlags';
import { PageTitle } from '../components/PageTitle';
import { IconComment, IconHeart, IconHeartFilled } from '../components/Icons';

type FeedPost = {
  id: string;
  body: string;
  created_at: string;
  like_count: number;
  visibility: string;
  author: {
    id: string;
    first_name: string | null;
    display_name: string | null;
    avatar_path: string | null;
  } | null;
  comments: { count: number }[];
};

type FeedData = {
  posts: FeedPost[];
  likedIds: Set<string>;
};

// Reads the same posts the mobile feed reads. RLS lets the caller see public
// posts + their own + posts in groups they belong to. Uses the denormalized
// like_count column (no unbounded liker arrays). Also loads which of these the
// caller has liked so the heart can toggle.
async function fetchFeed(): Promise<FeedData> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, body, created_at, like_count, visibility, author:profiles!posts_author_id_fkey(id, first_name, display_name, avatar_path), comments(count)',
    )
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  const posts = (data ?? []) as unknown as FeedPost[];

  const me = await currentUserId();
  let likedIds = new Set<string>();
  if (me && posts.length) {
    const { data: likes } = await supabase
      .from('reactions')
      .select('entity_id')
      .eq('entity_type', 'post')
      .eq('user_id', me)
      .eq('kind', 'like')
      .in(
        'entity_id',
        posts.map((p) => p.id),
      );
    likedIds = new Set((likes ?? []).map((r: { entity_id: string }) => r.entity_id));
  }
  return { posts, likedIds };
}

function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl ?? null;
}

export function Feed() {
  const { isEnabled } = useFeatureFlags();
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const [commentFor, setCommentFor] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery({
    queryKey: ['feed'],
    queryFn: fetchFeed,
  });

  const createPost = useMutation({
    mutationFn: async (text: string) => {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      // visibility 'all' is the DB check-constraint value for a public post.
      const { error } = await supabase
        .from('posts')
        .insert({ author_id: me, body: text.trim(), visibility: 'all' });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (v: { id: string; liked: boolean }) => {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      if (v.liked) {
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('entity_type', 'post')
          .eq('entity_id', v.id)
          .eq('user_id', me)
          .eq('kind', 'like');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('reactions').insert({
          entity_type: 'post',
          entity_id: v.id,
          user_id: me,
          kind: 'like',
        });
        if (error && error.code !== '23505') throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });

  const addComment = useMutation({
    mutationFn: async (v: { postId: string; text: string }) => {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      const { error } = await supabase
        .from('comments')
        .insert({ post_id: v.postId, author_id: me, body: v.text.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setCommentBody('');
      setCommentFor(null);
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  // Report a post -> moderation_queue via the report_content RPC (SECURITY
  // DEFINER; resolves org + author server-side). Gives the community a safety
  // valve the web app was missing.
  const report = useMutation({
    mutationFn: async (v: { postId: string; reason: string }) => {
      const { error } = await supabase.rpc('report_content', {
        p_entity_type: 'post',
        p_entity_id: v.postId,
        p_reason: v.reason.trim() || 'Reported from web',
      });
      if (error) throw error;
    },
    onSuccess: (_data, v) => {
      setReportReason('');
      setReportFor(null);
      setReportedIds((prev) => new Set(prev).add(v.postId));
    },
  });

  if (!isEnabled('community_wall'))
    return <p className="text-muted">The community wall is turned off.</p>;

  const posts = data?.posts ?? [];
  const likedIds = data?.likedIds ?? new Set<string>();

  return (
    <div className="space-y-4">
      <PageTitle>Community</PageTitle>

      {/* Composer */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share something with the community…"
          rows={3}
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

      {isLoading && <p className="text-heading">Loading the feed…</p>}
      {error && <p className="text-danger">Couldn’t load the feed.</p>}
      {!isLoading && !error && posts.length === 0 && (
        <p className="text-muted">It’s quiet here — be the first to post.</p>
      )}

      {posts.map((p) => {
        const name = p.author?.display_name || p.author?.first_name || 'Member';
        const img = avatarUrl(p.author?.avatar_path);
        const liked = likedIds.has(p.id);
        return (
          <article
            key={p.id}
            className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
          >
            <header className="mb-2 flex items-center gap-3">
              {img ? (
                <img
                  src={img}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-full bg-magenta text-sm font-semibold text-white">
                  {name[0]}
                </div>
              )}
              <div>
                {p.author?.id ? (
                  <Link
                    to={`/users/${p.author.id}`}
                    className="text-sm font-semibold hover:text-magenta-text hover:underline"
                  >
                    {name}
                  </Link>
                ) : (
                  <div className="text-sm font-semibold">{name}</div>
                )}
                <div className="text-xs text-faint">
                  {new Date(p.created_at).toLocaleDateString()}
                  {p.visibility === 'group' && ' · group'}
                </div>
              </div>
            </header>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
              {p.body}
            </p>
            <footer className="mt-3 flex gap-4 text-sm text-muted">
              <button
                onClick={() => toggleLike.mutate({ id: p.id, liked })}
                disabled={toggleLike.isPending}
                className={`flex items-center gap-1.5 transition-colors ${
                  liked ? 'font-semibold text-magenta' : 'hover:text-magenta-text'
                }`}
              >
                {liked ? (
                  <IconHeartFilled className="h-[17px] w-[17px]" />
                ) : (
                  <IconHeart className="h-[17px] w-[17px]" />
                )}
                {p.like_count}
              </button>
              <button
                onClick={() =>
                  setCommentFor((cur) => (cur === p.id ? null : p.id))
                }
                className="flex items-center gap-1.5 transition-colors hover:text-magenta-text"
              >
                <IconComment className="h-[17px] w-[17px]" />
                {p.comments?.[0]?.count ?? 0}
              </button>
              {reportedIds.has(p.id) ? (
                <span className="ml-auto text-xs text-faint">Reported ✓</span>
              ) : (
                <button
                  onClick={() => setReportFor((cur) => (cur === p.id ? null : p.id))}
                  className="ml-auto text-xs text-faint hover:text-danger"
                >
                  Report
                </button>
              )}
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
                  onClick={() =>
                    addComment.mutate({ postId: p.id, text: commentBody })
                  }
                  disabled={!commentBody.trim() || addComment.isPending}
                  className="rounded-lg bg-magenta px-3 py-2 text-sm font-semibold text-white hover:bg-magenta-hi disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            )}

            {reportFor === p.id && (
              <div className="mt-3 flex gap-2">
                <input
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Reason (optional)…"
                  className="flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-danger"
                />
                <button
                  onClick={() => report.mutate({ postId: p.id, reason: reportReason })}
                  disabled={report.isPending}
                  className="rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-white hover:bg-danger-hi disabled:opacity-50"
                >
                  {report.isPending ? 'Reporting…' : 'Report'}
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
