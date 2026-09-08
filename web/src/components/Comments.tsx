import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, currentUserId } from '../lib/supabase';
import { Avatar } from './Avatar';
import { IconHeart, IconHeartFilled } from './Icons';

// The comment thread under a post.
//
// The feed previously showed only a comment COUNT and a write box: clicking the
// icon let you add a comment but never showed the ones already there, so a post
// saying "2 comments" opened to nothing. This lists them, and adds the two
// things people expect from anything feed-shaped — replying to a comment and
// liking one.
//
// Replies are one level deep, matching the database trigger. Deeper nesting
// cannot be rendered legibly on a phone and every mature social product has
// collapsed to this shape.

type Row = {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  author: {
    id: string;
    display_name: string | null;
    first_name: string | null;
    avatar_path: string | null;
  } | null;
};

type Thread = {
  rows: Row[];
  likeCount: Record<string, number>;
  likedByMe: Set<string>;
};

async function fetchThread(postId: string): Promise<Thread> {
  const { data, error } = await supabase
    .from('comments')
    .select(
      'id, body, created_at, parent_id, author:profiles!comments_author_id_fkey(id, display_name, first_name, avatar_path)',
    )
    .eq('post_id', postId)
    .order('created_at');
  if (error) throw error;
  const rows = (data ?? []) as unknown as Row[];

  const likeCount: Record<string, number> = {};
  const likedByMe = new Set<string>();
  if (rows.length) {
    const ids = rows.map((r) => r.id);
    const [{ data: all }, me] = await Promise.all([
      supabase
        .from('reactions')
        .select('entity_id, user_id')
        .eq('entity_type', 'comment')
        .eq('kind', 'like')
        .in('entity_id', ids),
      currentUserId(),
    ]);
    (all ?? []).forEach((r: { entity_id: string; user_id: string }) => {
      likeCount[r.entity_id] = (likeCount[r.entity_id] ?? 0) + 1;
      if (me && r.user_id === me) likedByMe.add(r.entity_id);
    });
  }
  return { rows, likeCount, likedByMe };
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

export function Comments({ postId }: { postId: string }) {
  const qc = useQueryClient();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [replyDraft, setReplyDraft] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchThread(postId),
  });

  // Without the replies migration the select fails on parent_id and the thread
  // would render as "no comments yet" on a post that plainly has some, which
  // looks like data loss rather than a missing migration.
  if (error) {
    const msg = (error as Error).message ?? '';
    return (
      <div className="mt-3 border-t border-line pt-3">
        <p className="text-sm text-danger">
          {/parent_id/.test(msg)
            ? 'Comments need the replies migration on this project: supabase/migrations/20260908180000_comment_replies_v1.sql'
            : `Could not load comments: ${msg}`}
        </p>
      </div>
    );
  }

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['comments', postId] });
    void qc.invalidateQueries({ queryKey: ['feed'] });
    void qc.invalidateQueries({ queryKey: ['group-posts'] });
  };

  const add = useMutation({
    mutationFn: async (v: { body: string; parentId: string | null }) => {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        author_id: me,
        body: v.body.trim(),
        parent_id: v.parentId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft('');
      setReplyDraft('');
      setReplyTo(null);
      refresh();
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (v: { commentId: string; liked: boolean }) => {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      if (v.liked) {
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('entity_type', 'comment')
          .eq('entity_id', v.commentId)
          .eq('user_id', me)
          .eq('kind', 'like');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('reactions').insert({
          entity_type: 'comment',
          entity_id: v.commentId,
          user_id: me,
          kind: 'like',
        });
        // 23505 is the unique constraint: already liked, nothing to do.
        if (error && error.code !== '23505') throw error;
      }
    },
    onSuccess: refresh,
  });

  const rows = data?.rows ?? [];
  const tops = rows.filter((r) => !r.parent_id);
  const repliesOf = (id: string) => rows.filter((r) => r.parent_id === id);

  const nameOf = (r: Row) =>
    r.author?.display_name || r.author?.first_name || 'Member';

  function CommentRow({ r, isReply }: { r: Row; isReply: boolean }) {
    const liked = data?.likedByMe.has(r.id) ?? false;
    const count = data?.likeCount[r.id] ?? 0;
    const name = nameOf(r);
    return (
      <div className={'flex gap-2.5 ' + (isReply ? 'ml-10' : '')}>
        <Avatar path={r.author?.avatar_path} name={name} size={isReply ? 26 : 30} />
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-surface-2 px-3 py-2">
            {r.author?.id ? (
              <Link
                to={`/users/${r.author.id}`}
                className="text-sm font-semibold text-heading hover:underline"
              >
                {name}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-heading">{name}</span>
            )}
            <p className="whitespace-pre-wrap text-sm text-body">{r.body}</p>
          </div>
          <div className="mt-1 flex items-center gap-4 pl-1 text-xs">
            <span className="text-faint">{timeAgo(r.created_at)}</span>
            <button
              onClick={() => toggleLike.mutate({ commentId: r.id, liked })}
              className={
                'flex items-center gap-1 transition-colors ' +
                (liked ? 'font-semibold text-magenta-text' : 'text-faint hover:text-magenta-text')
              }
            >
              {liked ? (
                <IconHeartFilled className="h-3.5 w-3.5" />
              ) : (
                <IconHeart className="h-3.5 w-3.5" />
              )}
              {count > 0 && count}
            </button>
            {!isReply && (
              <button
                onClick={() => {
                  setReplyTo(replyTo === r.id ? null : r.id);
                  setReplyDraft('');
                }}
                className="text-faint transition-colors hover:text-magenta-text"
              >
                Reply
              </button>
            )}
          </div>

          {replyTo === r.id && (
            <div className="mt-2 flex gap-2">
              <input
                autoFocus
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && replyDraft.trim()) {
                    add.mutate({ body: replyDraft, parentId: r.id });
                  }
                }}
                placeholder={`Reply to ${name}…`}
                className="flex-1 rounded-full border border-line px-3 py-1.5 text-sm outline-none focus:border-magenta"
              />
              <button
                onClick={() => add.mutate({ body: replyDraft, parentId: r.id })}
                disabled={!replyDraft.trim() || add.isPending}
                className="rounded-full bg-magenta px-3 py-1.5 text-sm font-semibold text-white hover:bg-magenta-hi disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 border-t border-line pt-3">
      {isLoading && <p className="text-sm text-muted">Loading comments…</p>}

      {!isLoading && tops.length === 0 && (
        <p className="text-sm text-faint">No comments yet. Be the first.</p>
      )}

      {tops.map((r) => (
        <div key={r.id} className="space-y-2">
          <CommentRow r={r} isReply={false} />
          {repliesOf(r.id).map((child) => (
            <CommentRow key={child.id} r={child} isReply />
          ))}
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              add.mutate({ body: draft, parentId: null });
            }
          }}
          placeholder="Write a comment…"
          className="flex-1 rounded-full border border-line px-4 py-2 text-sm outline-none focus:border-magenta"
        />
        <button
          onClick={() => add.mutate({ body: draft, parentId: null })}
          disabled={!draft.trim() || add.isPending}
          className="rounded-full bg-magenta px-4 py-2 text-sm font-semibold text-white hover:bg-magenta-hi disabled:opacity-50"
        >
          {add.isPending ? 'Posting…' : 'Post'}
        </button>
      </div>

      {add.isError && (
        <p className="text-sm text-danger">
          {(add.error as Error).message.includes('parent_id')
            ? 'Replies are not enabled on this project yet. Run the comment replies migration.'
            : (add.error as Error).message}
        </p>
      )}
    </div>
  );
}
