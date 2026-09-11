// Social layer on Supabase (Phase B): feed posts, comments, likes, groups.
// Returns LEGACY Sendbird-channel/message shapes so the existing screens
// render unchanged — same trick as the mock layer, but backed by Postgres.

import { supabase, currentUserId } from './client';
import { publicUrlFor, signedUrlsFor } from './supabase.storage';

// Local cached session read — no network round-trip per request.
const uid = currentUserId;

const senderFromProfile = (p: any) => {
  const avatar = publicUrlFor('avatars', p?.avatar_path) ?? '';
  return {
    userId: p?.id ?? 'unknown',
    nickname: p?.display_name || p?.first_name || 'Member',
    plainProfileUrl: avatar,
    profileUrl: avatar,
    isActive: true,
    metaData: { id: p?.id ?? 'unknown' },
  };
};

// ---------------------------------------------------------------------------
// FEED
// ---------------------------------------------------------------------------

// Shared feed-post select: post + author + group name + comment count. Used by
// getFeedPosts, getPostsByUser and searchPosts so all three render identically.
const FEED_POST_SELECT =
  '*, author:profiles!posts_author_id_fkey(id, first_name, display_name, avatar_path), group:groups(name), comments(count)';

/**
 * Map raw post rows (already fetched with FEED_POST_SELECT) into the legacy
 * Sendbird "post channel" shapes the feed screens expect. Extracted so search
 * and profile-post lists reuse the exact same mapping as the main feed.
 */
async function mapPostRowsToChannels(posts: any[]) {
  if (!posts || posts.length === 0) return [];

  const postIds = posts.map(p => p.id);
  const me = await uid();

  // "Did I like it" — ONLY the caller's own reactions (tiny), never the full
  // liker list. Counts come from the denormalized posts.like_count column.
  const likedByMe = new Set<string>();
  if (me) {
    const { data: mine } = await supabase
      .from('reactions')
      .select('entity_id')
      .eq('entity_type', 'post')
      .eq('user_id', me)
      .in('entity_id', postIds);
    (mine ?? []).forEach(r => likedByMe.add(r.entity_id));
  }

  // Post images live in a PRIVATE bucket now — batch-sign with a feed-sized
  // (600px) thumbnail transform so scrolling doesn't pull full-res originals.
  const imgPaths = posts.map(p => p.image_path).filter(Boolean) as string[];
  const [smUrls, mdUrls] = await Promise.all([
    imgPaths.length
      ? signedUrlsFor('post-images', imgPaths, { width: 600, quality: 65 })
      : Promise.resolve({} as Record<string, string>),
    imgPaths.length
      ? signedUrlsFor('post-images', imgPaths, { width: 1200, quality: 75 })
      : Promise.resolve({} as Record<string, string>),
  ]);

  return posts.map(p => ({
    url: p.id,
    name: `post-${p.id}`,
    createdAt: new Date(p.created_at).getTime(),
    creator: senderFromProfile(p.author),
    customType: 'post',
    cachedMetaData: { type: 'post' },
    memberCount: 1,
    lastMessage: {
      message: p.body,
      createdAt: new Date(p.created_at).getTime(),
      sender: senderFromProfile(p.author),
    },
    data: JSON.stringify({
      firstMessage: p.body,
      commentQty: p.comments?.[0]?.count ?? 0,
      // Counts + own-like flag instead of the full liker array.
      likeCount: p.like_count ?? 0,
      likedByMe: likedByMe.has(p.id),
      likes: [], // legacy key kept present (empty) for any stray consumer
      // Signed, resized thumbnails from the private post-images bucket.
      image_sm: p.image_path ? smUrls[p.image_path] ?? '' : '',
      image_md: p.image_path ? mdUrls[p.image_path] ?? '' : '',
      image_lg: p.image_path ? mdUrls[p.image_path] ?? '' : '',
      visibility: p.visibility,
      groupId: p.group_id,
      groupName: p.group?.name ?? null,
      audienceTags: p.audience_tags ?? [],
    }),
  }));
}

/**
 * Posts shaped like the legacy Sendbird "post channels".
 * `before` is a created_at cursor (ISO string) for keyset pagination — pass
 * the oldest loaded post's created_at to fetch the next page.
 */
export async function getFeedPosts(limit = 50, before?: string) {
  let query = supabase.from('posts').select(FEED_POST_SELECT);
  if (before) query = query.lt('created_at', before);
  const { data: posts, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return mapPostRowsToChannels(posts ?? []);
}

// ---------------------------------------------------------------------------
// TEXT HELPERS — hashtags + mentions
// ---------------------------------------------------------------------------

// Shared token patterns (keep in sync with the SQL trigger in
// 20260806120000_community_features_v1.sql). Global+capture for extraction.
const HASHTAG_RE = /#([A-Za-z0-9_]{1,50})/g;
const MENTION_RE = /@([A-Za-z0-9_.]{1,50})/g;

/** Unique, lowercased hashtags found in a body (without the leading '#'). */
export function extractHashtags(text: string): string[] {
  const out = new Set<string>();
  for (const m of (text ?? '').matchAll(HASHTAG_RE)) out.add(m[1].toLowerCase());
  return [...out];
}

/** Unique @-handles found in a body (without the leading '@'), original case. */
export function extractMentionHandles(text: string): string[] {
  const out = new Set<string>();
  for (const m of (text ?? '').matchAll(MENTION_RE)) out.add(m[1]);
  return [...out];
}

/**
 * Record @mentions for a post (the composer resolves handles -> profile ids and
 * passes the ids here). Inserts into post_mentions; the DB trigger fans out a
 * NEW_MENTION notification. Best-effort — a failed mention insert must not fail
 * the post itself, so callers can ignore rejections.
 */
export async function recordPostMentions(postId: string, profileIds: string[]) {
  const ids = [...new Set((profileIds ?? []).filter(Boolean))];
  if (ids.length === 0) return;
  const rows = ids.map(id => ({ post_id: postId, mentioned_profile_id: id }));
  const { error } = await supabase
    .from('post_mentions')
    .upsert(rows, { onConflict: 'post_id,mentioned_profile_id' });
  if (error && error.code !== '23505') throw error;
}

export async function createPost(
  body: string,
  options?: {
    groupId?: string | null;
    imagePath?: string | null;
    /** legacy "My Groups" audience: role/diagnosis tag names, lowercased */
    audienceTags?: string[];
    /** resolved profile ids for @mentions in the body (composer supplies) */
    mentionIds?: string[];
  },
) {
  const me = await uid();
  if (!me) throw new Error('Not authenticated');
  const isGroupAudience =
    !!options?.groupId || (options?.audienceTags?.length ?? 0) > 0;
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: me,
      body,
      visibility: isGroupAudience ? 'group' : 'all',
      group_id: options?.groupId ?? null,
      image_path: options?.imagePath ?? null,
      audience_tags: (options?.audienceTags ?? []).map(t => t.toLowerCase()),
    })
    .select()
    .single();
  if (error) throw error;

  // Record @mentions -> DB trigger sends each mentioned user a NEW_MENTION
  // notification. Best-effort: never fail a successful post over a mention.
  if (data?.id && (options?.mentionIds?.length ?? 0) > 0) {
    try {
      await recordPostMentions(data.id, options!.mentionIds!);
    } catch (e) {
      if (__DEV__) console.warn('[supabase] recordPostMentions failed', e);
    }
  }
  return data;
}

/**
 * Delete one of the caller's OWN posts. RLS (posts_delete) enforces ownership;
 * a DB trigger cleans up the post's likes + its comments' likes, and FKs
 * cascade the comments/hashtags/mentions.
 */
export async function deletePost(postId: string) {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
  return true;
}

/** A member's "joined" date (profiles.created_at). Null if not visible. */
export async function getMemberJoinedAt(
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.created_at ?? null;
}

/** Posts authored by one user, newest first — legacy feed-channel shapes. */
export async function getPostsByUser(userId: string, limit = 100) {
  const { data, error } = await supabase
    .from('posts')
    .select(FEED_POST_SELECT)
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return mapPostRowsToChannels(data ?? []);
}

/**
 * Posts shared to one group, newest first.
 *
 * RLS already limits group posts to that group's members, so a non-member
 * simply gets nothing back rather than a partial view — which is why the
 * group screen shows its join prompt in place of the feed rather than an
 * empty state that looks like a quiet group.
 */
export async function getPostsByGroup(groupId: string, limit = 100) {
  const { data, error } = await supabase
    .from('posts')
    .select(FEED_POST_SELECT)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return mapPostRowsToChannels(data ?? []);
}

/**
 * One group by id, shaped as a legacy channel like the lists are.
 */
export async function getGroupById(groupId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: counts } = await supabase.rpc('group_member_counts');
  const count =
    (counts ?? []).find((r: any) => r.group_id === groupId)?.member_count ?? 0;
  return groupToChannel({ ...data, member_count: Number(count) || 0 });
}

/**
 * Full-text search over posts the caller can see (search_posts RPC is SECURITY
 * INVOKER, so post RLS applies). Re-fetches with the feed select so results
 * render exactly like the main feed, preserving the RPC's rank/recency order.
 */
export async function searchPosts(q: string) {
  const term = (q ?? '').trim();
  if (!term) return [];
  const { data: hits, error } = await supabase.rpc('search_posts', { q: term });
  if (error) throw error;
  const ids = (hits ?? []).map((p: any) => p.id);
  if (ids.length === 0) return [];

  const { data, error: fetchErr } = await supabase
    .from('posts')
    .select(FEED_POST_SELECT)
    .in('id', ids);
  if (fetchErr) throw fetchErr;

  const order = new Map<string, number>(
    ids.map((id: string, i: number): [string, number] => [id, i]),
  );
  const sorted = (data ?? []).sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
  );
  return mapPostRowsToChannels(sorted);
}

/**
 * Visible posts carrying a given #hashtag (posts_by_hashtag RPC is SECURITY
 * INVOKER, so post RLS applies). Re-fetches with the feed select so results
 * render exactly like the main feed, preserving the RPC's recency order.
 * Accepts the tag with or without a leading '#'.
 */
export async function getPostsByHashtag(tag: string) {
  const term = (tag ?? '').trim().replace(/^#/, '');
  if (!term) return [];
  const { data: hits, error } = await supabase.rpc('posts_by_hashtag', {
    tag: term,
  });
  if (error) throw error;
  const ids = (hits ?? []).map((p: any) => p.id);
  if (ids.length === 0) return [];

  const { data, error: fetchErr } = await supabase
    .from('posts')
    .select(FEED_POST_SELECT)
    .in('id', ids);
  if (fetchErr) throw fetchErr;

  const order = new Map<string, number>(
    ids.map((id: string, i: number): [string, number] => [id, i]),
  );
  const sorted = (data ?? []).sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
  );
  return mapPostRowsToChannels(sorted);
}

/**
 * Report a post/comment into the moderation queue (report_content RPC stamps
 * flagged_by='user', status='pending'). Returns the new queue row id.
 */
export async function reportContent(
  entityType: 'post' | 'comment',
  entityId: string,
  reason: string,
) {
  const { data, error } = await supabase.rpc('report_content', {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_reason: reason ?? '',
  });
  if (error) throw error;
  return data as string;
}

/**
 * Comments shaped like legacy Sendbird messages (incl. 'smile' reactions).
 * IMPORTANT: legacy semantics — the POST ITSELF is the first "message"
 * (Sendbird stored posts as channels whose first message was the body), so
 * we prepend a post-shaped message; its reactions are the post's likes.
 */
export async function getPostComments(postId: string) {
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select(
      '*, author:profiles!posts_author_id_fkey(id, first_name, display_name, avatar_path)',
    )
    .eq('id', postId)
    .single();
  if (postError) throw postError;

  // Do NOT pull every liker (a viral post = thousands of rows, and this
  // re-runs whenever a comment is liked). The displayed count comes from
  // post.like_count; we only need a bounded sample for avatars + whether the
  // caller liked it (so the heart state is correct).
  const me = await uid();
  const [{ data: sample }, myLike] = await Promise.all([
    supabase
      .from('reactions')
      .select('user_id')
      .eq('entity_type', 'post')
      .eq('entity_id', postId)
      .limit(30),
    me
      ? supabase
          .from('reactions')
          .select('id', { head: true, count: 'exact' })
          .eq('entity_type', 'post')
          .eq('entity_id', postId)
          .eq('user_id', me)
      : Promise.resolve({ count: 0 } as any),
  ]);
  const likerIds = (sample ?? []).map(r => r.user_id);
  // Ensure the caller's own id is present if they liked (for .includes checks).
  if (me && (myLike?.count ?? 0) > 0 && !likerIds.includes(me)) {
    likerIds.push(me);
  }

  const postAsMessage = {
    messageId: `post-${post.id}`,
    // channelUrl is REQUIRED: the detail screen matches its feed post via
    // messages[0].channelUrl === post.url. Without it, image + like count
    // never rendered on the detail screen.
    channelUrl: post.id,
    message: post.body,
    createdAt: new Date(post.created_at).getTime(),
    messageType: 'user',
    sender: senderFromProfile(post.author),
    reactions:
      likerIds.length > 0
        ? [{ key: 'smile', sampledUserIds: likerIds, userIds: likerIds }]
        : [],
  };

  const { data: comments, error } = await supabase
    .from('comments')
    .select(
      '*, author:profiles!comments_author_id_fkey(id, first_name, display_name, avatar_path)',
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw error;
  if (!comments || comments.length === 0) return [postAsMessage];

  const ids = comments.map(c => c.id);
  const { data: reactionRows } = await supabase
    .from('reactions')
    .select('entity_id, user_id')
    .eq('entity_type', 'comment')
    .in('entity_id', ids);

  const byComment: Record<string, string[]> = {};
  (reactionRows ?? []).forEach(r => {
    (byComment[r.entity_id] ??= []).push(r.user_id);
  });

  return [
    postAsMessage,
    ...comments.map(c => ({
      messageId: c.id,
      channelUrl: postId,
      message: c.body,
      createdAt: new Date(c.created_at).getTime(),
      messageType: 'user',
      sender: senderFromProfile(c.author),
      reactions:
        (byComment[c.id] ?? []).length > 0
          ? [
              {
                key: 'smile',
                sampledUserIds: byComment[c.id],
                userIds: byComment[c.id],
              },
            ]
          : [],
    })),
  ];
}

/**
 * Delete one of the caller's OWN comments. RLS (comments_delete) enforces
 * author ownership (author_id = auth.uid()); verified in the initial schema
 * (20260702145556) and re-asserted in 20260702170918.
 *
 * NOTE: comment reactions are polymorphic (entity_type='comment', no FK), so a
 * single-comment delete leaves its like rows orphaned. The POST-delete path
 * scrubs comment likes via cleanup_post_relations, but there is no per-comment
 * cleanup trigger yet. FOLLOW-UP (needs a migration): add an AFTER DELETE
 * trigger on comments that deletes reactions where entity_type='comment' and
 * entity_id = old.id.
 */
export async function deleteComment(commentId: string) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);
  if (error) throw error;
  return true;
}

export async function sendComment(postId: string, body: string) {
  const me = await uid();
  if (!me) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, author_id: me, body })
    .select(
      '*, author:profiles!comments_author_id_fkey(id, first_name, display_name, avatar_path)',
    )
    .single();
  if (error) throw error;
  return {
    messageId: data.id,
    message: data.body,
    createdAt: new Date(data.created_at).getTime(),
    messageType: 'user',
    sender: senderFromProfile(data.author),
    reactions: [],
  };
}

/**
 * Toggle a like. Returns `{ count, likedByMe }` — NOT the full liker list.
 * At scale a viral post has thousands of likers; shipping that array on every
 * tap was the #1 payload problem. Post counts come from the denormalized
 * posts.like_count column (trigger-maintained); comment counts from a bounded
 * count() query.
 */
export async function toggleReactionOn(
  entityType: 'post' | 'comment',
  entityId: string,
): Promise<{ count: number; likedByMe: boolean }> {
  const me = await uid();
  if (!me) throw new Error('Not authenticated');

  const { data: existing, error: findError } = await supabase
    .from('reactions')
    .select('id')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('user_id', me)
    .maybeSingle();
  if (findError) throw findError;

  let likedByMe: boolean;
  if (existing) {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    likedByMe = false;
  } else {
    const { error } = await supabase
      .from('reactions')
      .insert({ entity_type: entityType, entity_id: entityId, user_id: me });
    // 23505 = already liked (double-tap race) — treat as success.
    if (error && error.code !== '23505') throw error;
    likedByMe = true;
  }

  let count = 0;
  if (entityType === 'post') {
    const { data: post } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', entityId)
      .maybeSingle();
    count = post?.like_count ?? 0;
  } else {
    const { count: c } = await supabase
      .from('reactions')
      .select('id', { count: 'exact', head: true })
      .eq('entity_type', 'comment')
      .eq('entity_id', entityId);
    count = c ?? 0;
  }
  return { count, likedByMe };
}

// ---------------------------------------------------------------------------
// GROUPS
// ---------------------------------------------------------------------------

const groupToChannel = (g: any, members: any[] = [], joined = false) => ({
  url: g.id,
  name: g.name,
  // Covers live in the public avatars bucket (uid-prefixed path).
  coverUrl: publicUrlFor('avatars', g.cover_path) ?? '',
  memberCount: g.member_count ?? members.length,
  joinedMemberCount: g.member_count ?? members.length,
  createdAt: new Date(g.created_at).getTime(),
  customType: 'group',
  cachedMetaData: { type: 'group', recommendation: 'true' },
  members: members.map(senderFromProfile),
  creator: null,
  lastMessage: {
    message: g.description ?? 'Welcome to the group!',
    createdAt: new Date(g.created_at).getTime(),
    sender: { userId: 'system', nickname: g.name, metaData: { id: 'system' } },
  },
  unreadMessageCount: 0,
  data: JSON.stringify({ recommendation: true, joined }),
});

export async function getAllGroups() {
  // Rosters are gated to co-members (privacy), so the embedded group_members
  // count would read 0 for groups you're not in. Pull counts via the
  // group_member_counts() RPC instead (counts aren't sensitive; rosters are).
  const [{ data, error }, { data: counts }] = await Promise.all([
    supabase.from('groups').select('*').order('name'),
    supabase.rpc('group_member_counts'),
  ]);
  if (error) throw error;
  const countByGroup: Record<string, number> = {};
  (counts ?? []).forEach((r: any) => {
    countByGroup[r.group_id] = Number(r.member_count) || 0;
  });
  return (data ?? []).map(g =>
    groupToChannel({ ...g, member_count: countByGroup[g.id] ?? 0 }),
  );
}

/**
 * Search groups by name (trigram-indexed, case-insensitive) via the
 * search_groups RPC. Returns legacy channel shapes with member counts, same as
 * getAllGroups. Empty query returns [] (caller shows the full list instead).
 */
export async function searchGroups(q: string) {
  const term = (q ?? '').trim();
  if (!term) return [];
  const [{ data, error }, { data: counts }] = await Promise.all([
    supabase.rpc('search_groups', { q: term }),
    supabase.rpc('group_member_counts'),
  ]);
  if (error) throw error;
  const countByGroup: Record<string, number> = {};
  (counts ?? []).forEach((r: any) => {
    countByGroup[r.group_id] = Number(r.member_count) || 0;
  });
  return (data ?? []).map((g: any) =>
    groupToChannel({ ...g, member_count: countByGroup[g.id] ?? 0 }),
  );
}

/** Groups matched to the user's role/diagnosis via taxonomy tags. */
export async function getRecommendedGroups(terms: string[]) {
  const all = await getAllGroups();
  const wanted = terms.filter(Boolean).map(t => t.toLowerCase());
  if (wanted.length === 0) return all.slice(0, 4);
  const matches = all.filter((g: any) => {
    const name = g.name.toLowerCase();
    return wanted.some(t => name.includes(t.split(' ')[0]));
  });
  return matches.length > 0 ? matches : all.slice(0, 4);
}

export async function getMyGroupChannels() {
  const me = await uid();
  if (!me) return [];
  const { data: memberships, error } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('profile_id', me);
  if (error) throw error;
  const ids = (memberships ?? []).map(m => m.group_id);
  if (ids.length === 0) return [];

  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .in('id', ids);

  // Counts via the RPC (bounded); member avatars are loaded lazily on the
  // group-detail screen (getGroupMembers, capped) — do NOT pull every member
  // of every group just to render the Messages-tab list.
  const { data: counts } = await supabase.rpc('group_member_counts');
  const countByGroup: Record<string, number> = {};
  (counts ?? []).forEach((r: any) => {
    countByGroup[r.group_id] = Number(r.member_count) || 0;
  });

  return (groups ?? []).map(g =>
    groupToChannel({ ...g, member_count: countByGroup[g.id] ?? 0 }, [], true),
  );
}

/**
 * Create a group (atomic RPC: group + creator-as-admin + optional invitees).
 * Direct INSERTs on groups are blocked by RLS — this is the only entry.
 * Returns the new group shaped as a legacy channel.
 */
export async function createGroup(
  name: string,
  options?: {
    description?: string | null;
    memberIds?: string[];
    coverPath?: string | null;
  },
) {
  const { data: gid, error } = await supabase.rpc('create_group', {
    p_name: name,
    p_description: options?.description ?? null,
    p_member_ids: options?.memberIds ?? [],
    p_cover_path: options?.coverPath ?? null,
  });
  if (error) throw error;
  const { data: g } = await supabase
    .from('groups')
    .select('*, group_members(count)')
    .eq('id', gid)
    .single();
  return groupToChannel(
    { ...(g ?? { id: gid, name }), member_count: g?.group_members?.[0]?.count ?? 1 },
    [],
    true,
  );
}

/** Members of one group, shaped as legacy chat members (capped). */
export async function getGroupMembers(groupId: string, limit = 200) {
  const { data, error } = await supabase
    .from('group_members')
    .select(
      'member_role, profile:profiles(id, first_name, last_name, display_name, avatar_path)',
    )
    .eq('group_id', groupId)
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...senderFromProfile(r.profile),
    role: r.member_role,
  }));
}

export async function joinGroup(groupId: string) {
  const me = await uid();
  if (!me) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, profile_id: me });
  if (error && error.code !== '23505') throw error; // ignore already-joined
  return true;
}

export async function leaveGroup(groupId: string) {
  const me = await uid();
  if (!me) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('profile_id', me);
  // A rejected delete used to return true anyway — the UI reset as if the
  // user had left while the membership row survived.
  if (error) throw error;
  return true;
}
