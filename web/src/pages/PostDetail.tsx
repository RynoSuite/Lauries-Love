import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Avatar';
import { Comments } from '../components/Comments';
import { PostActions } from '../components/PostActions';

// A single post (/posts/:id).
//
// Added because the moderation queue's "view in feed" link had nowhere to
// point: it went to the feed root and left a moderator scrolling for the post
// they were judging. A post that can be reported needs an address. It also
// gives members something to share.
type Post = {
  id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  like_count: number;
  visibility: string;
  image_path: string | null;
  author: {
    id: string;
    first_name: string | null;
    display_name: string | null;
    avatar_path: string | null;
  } | null;
};

async function fetchPost(id: string): Promise<Post | null> {
  const { data } = await supabase
    .from('posts')
    .select(
      'id, body, created_at, edited_at, like_count, visibility, image_path, author:profiles!posts_author_id_fkey(id, first_name, display_name, avatar_path)',
    )
    .eq('id', id)
    .maybeSingle();
  return (data as unknown as Post) ?? null;
}

export function PostDetail() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    enabled: !!id,
  });

  if (isLoading) return <p className="text-heading">Loading…</p>;

  // Either it was deleted, or row-level security is hiding it — a group post
  // the viewer is not a member of reads exactly the same way from here.
  if (!data)
    return (
      <div>
        <Link to="/" className="text-sm text-magenta-text hover:underline">
          Back to the community
        </Link>
        <p className="mt-4 text-muted">
          This post is not available. It may have been deleted, or it belongs to
          a group you are not part of.
        </p>
      </div>
    );

  const name = data.author?.display_name || data.author?.first_name || 'Member';

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="text-sm text-magenta-text hover:underline">
        Back to the community
      </Link>

      <article className="mt-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <header className="mb-2 flex items-center gap-3">
          <Avatar path={data.author?.avatar_path} name={name} size={36} />
          <div>
            {data.author?.id ? (
              <Link
                to={`/users/${data.author.id}`}
                className="text-sm font-semibold hover:text-magenta-text hover:underline"
              >
                {name}
              </Link>
            ) : (
              <div className="text-sm font-semibold">{name}</div>
            )}
            <div className="text-xs text-faint">
              {new Date(data.created_at).toLocaleString()}
              {data.edited_at && ' · edited'}
              {data.visibility === 'group' && ' · group'}
            </div>
          </div>
          <div className="ml-auto">
            <PostActions
              postId={data.id}
              authorId={data.author?.id}
              body={data.body}
              imagePath={data.image_path}
              onChanged={() => {
                void qc.invalidateQueries({ queryKey: ['post', id] });
                void qc.invalidateQueries({ queryKey: ['feed'] });
              }}
            />
          </div>
        </header>

        {data.body && (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{data.body}</p>
        )}
        {data.image_path && (
          <img
            src={
              supabase.storage.from('post-images').getPublicUrl(data.image_path).data
                .publicUrl
            }
            alt=""
            className="mt-3 max-h-[390px] w-full rounded-xl border border-line object-cover"
          />
        )}

        <Comments postId={data.id} />
      </article>
    </div>
  );
}
