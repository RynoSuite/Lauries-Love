import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, currentUserId } from '../lib/supabase';
import { useFeatureFlags } from '../lib/featureFlags';
import { PageTitle } from '../components/PageTitle';
import { IconComment, IconHeart, IconHeartFilled } from '../components/Icons';
import { Avatar } from '../components/Avatar';
import { Comments } from '../components/Comments';
import { PostActions } from '../components/PostActions';

type FeedPost = {
  id: string;
  body: string;
  created_at: string;
  like_count: number;
  visibility: string;
  image_path: string | null;
  edited_at: string | null;
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
      'id, body, created_at, like_count, visibility, image_path, edited_at, author:profiles!posts_author_id_fkey(id, first_name, display_name, avatar_path), comments(count)',
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

export function Feed() {
  const { isEnabled } = useFeatureFlags();
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const [commentFor, setCommentFor] = useState<string | null>(null);
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['feed'],
    queryFn: fetchFeed,
  });

  // Images are downscaled in the browser before upload. A phone photo is
  // routinely 4-8MB and the feed renders it a few hundred pixels wide, so
  // shipping the original wastes the member's data for no visible gain.
  async function pickImage(file: File) {
    setImageError(null);
    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setImageError('That image is over 15MB, please pick a smaller one.');
      return;
    }
    setUploading(true);
    try {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not prepare the image');
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();
      const blob = await new Promise<Blob | null>((r) =>
        canvas.toBlob(r, 'image/jpeg', 0.85),
      );
      if (!blob) throw new Error('Could not prepare the image');

      // Storage policy requires the first path segment to be the uploader's
      // uid. No upsert: the timestamp makes collisions impossible, and upsert
      // would be evaluated against the bucket's UPDATE policy too.
      const path = `${me}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('post-images')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (error) throw error;
      setImagePath(path);
      setImagePreview(URL.createObjectURL(blob));
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Could not add the image.');
    } finally {
      setUploading(false);
    }
  }

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImagePath(null);
    setImageError(null);
  }

  const createPost = useMutation({
    mutationFn: async (text: string) => {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      // visibility 'all' is the DB check-constraint value for a public post.
      const { error } = await supabase.from('posts').insert({
        author_id: me,
        body: text.trim(),
        image_path: imagePath,
        visibility: 'all',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody('');
      clearImage();
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
          onKeyDown={(e) => {
            // Ctrl/Cmd+Enter posts. Plain Enter has to stay a newline here:
            // people write several paragraphs about their week, and a composer
            // that submits on Enter would cut them off mid-thought.
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              if ((body.trim() || imagePath) && !createPost.isPending && !uploading) {
                createPost.mutate(body);
              }
            }
          }}
          placeholder="Share something with the community…"
          rows={3}
          className="w-full resize-none rounded-lg border border-line p-3 text-sm outline-none focus:border-magenta"
        />

        {imagePreview && (
          <div className="relative mt-3 inline-block">
            <img
              src={imagePreview}
              alt=""
              className="max-h-56 rounded-lg border border-line object-contain"
            />
            <button
              onClick={clearImage}
              aria-label="Remove image"
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-ground/80 text-sm text-heading hover:bg-ground"
            >
              ×
            </button>
          </div>
        )}

        {imageError && <p className="mt-2 text-sm text-danger">{imageError}</p>}

        <div className="mt-2 flex items-center justify-between gap-3">
          <label className="cursor-pointer rounded-lg border border-line px-3 py-2 text-sm text-muted transition-colors hover:border-magenta hover:text-magenta-text">
            {uploading ? 'Adding…' : 'Add a photo'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void pickImage(f);
              }}
            />
          </label>
          <button
            onClick={() => createPost.mutate(body)}
            disabled={(!body.trim() && !imagePath) || createPost.isPending || uploading}
            className="rounded-lg bg-magenta px-4 py-2 text-sm font-semibold text-white hover:bg-magenta-hi disabled:opacity-50"
          >
            {createPost.isPending ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>

      {isLoading && <p className="text-heading">Loading the feed…</p>}
      {error && <p className="text-danger">Couldn’t load the feed.</p>}
      {!isLoading && !error && posts.length === 0 && (
        <p className="text-muted">It’s quiet here, be the first to post.</p>
      )}

      {posts.map((p) => {
        const name = p.author?.display_name || p.author?.first_name || 'Member';
        const liked = likedIds.has(p.id);
        return (
          <article
            key={p.id}
            className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
          >
            <header className="mb-2 flex items-center gap-3">
              <Avatar path={p.author?.avatar_path} name={name} size={36} />
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
                  {p.edited_at && ' · edited'}
                  {p.visibility === 'group' && ' · group'}
                </div>
              </div>
              <div className="ml-auto">
                <PostActions
                  postId={p.id}
                  authorId={p.author?.id}
                  body={p.body}
                  imagePath={p.image_path}
                />
              </div>
            </header>
            {/* Text first: the post is what someone wrote, and the photo
                illustrates it. Leading with the image pushed the words below
                the fold on anything tall. */}
            {p.body && (
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                {p.body}
              </p>
            )}
            {p.image_path && (
              <img
                src={
                  supabase.storage.from('post-images').getPublicUrl(p.image_path).data
                    .publicUrl
                }
                alt=""
                loading="lazy"
                className="mt-3 max-h-[390px] w-full rounded-xl border border-line object-cover"
              />
            )}
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

            {commentFor === p.id && <Comments postId={p.id} />}

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
