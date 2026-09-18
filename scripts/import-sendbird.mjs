#!/usr/bin/env node
/**
 * Import the legacy community feed into Supabase.
 *
 *   node scripts/import-sendbird.mjs --dir <export-dir> --dry-run
 *   node scripts/import-sendbird.mjs --dir <export-dir> --limit 25
 *   node scripts/import-sendbird.mjs --dir <export-dir>
 *
 * Reads posts.ndjson, comments.ndjson and likes.ndjson from
 * scripts/export-sendbird.mjs. Needs SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY — posts are written on other people's behalf, so
 * RLS has to be bypassed.
 *
 * MEMBERS MUST BE IMPORTED FIRST. Every row here carries a foreign key to
 * profiles.id, resolved through `legacy_cognito_id` — the Cognito sub, which
 * is also the Sendbird user_id.
 *
 * Idempotent on `posts.legacy_channel_url`: a post already carrying that URL
 * is skipped, so a run that dies part way can be repeated. Comments and likes
 * are keyed off the post that owns them, and likes additionally collide on
 * reactions' own unique constraint.
 *
 * ── What is deliberately not imported ──────────────────────────────────────
 *
 * 160 posts with no recoverable body. `firstMessage` was not cached before
 * ~mid-March 2025 and retention deleted the underlying messages, so there is
 * nothing to show. `posts.body` is NOT NULL and an empty post in a feed is
 * worse than an absent one.
 *
 * 17 posts, 33 likes and their authors: 13 people who exist in Sendbird but
 * not in the legacy member table, i.e. deleted accounts. Creating profiles for
 * them would resurrect accounts those people removed.
 *
 * 740 of 783 comments, which no longer exist anywhere.
 *
 * The 2 image-only posts wait for the image migration, since importing them
 * now would put two captionless, pictureless rows in the feed.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const arg = (n, d = null) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? d : args[i + 1];
};
const DIR = arg('dir');
const LIMIT = Number(arg('limit', '0')) || 0;
const DRY_RUN = args.includes('--dry-run');

if (!DIR) {
  console.error('usage: node scripts/import-sendbird.mjs --dir <export-dir> [--dry-run] [--limit N]');
  process.exit(1);
}
if (!DRY_RUN && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (or pass --dry-run).');
  process.exit(1);
}

const require = createRequire(new URL('../web/package.json', import.meta.url));
const { createClient } = require('@supabase/supabase-js');
const sb = DRY_RUN
  ? null
  : createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

const read = (f) =>
  readFileSync(`${DIR}/${f}`, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

const posts = read('posts.ndjson');
const comments = read('comments.ndjson');
const likes = read('likes.ndjson');

/**
 * Legacy visibility -> the new column, which is constrained to ('all','group').
 *
 * 'public' becomes 'all', and a missing value becomes 'all' too: 109 posts
 * carry no visibility, the legacy wall was public, and the column's own
 * default is 'all'.
 *
 * Audience tags are copied whatever the visibility, because they are
 * information the old app recorded. They only RESTRICT anything when
 * visibility is 'group' — see 20260702165624_post_audience_tags.sql. A public
 * post therefore stays public: importing it as tag-restricted would hide
 * content the community could previously read.
 */
const visibilityFor = (v) => (v === 'group' ? 'group' : 'all');

// ── cognito sub -> profile id ──────────────────────────────────────────────
const byCognito = new Map();
if (!DRY_RUN) {
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from('profiles')
      .select('id, legacy_cognito_id')
      .not('legacy_cognito_id', 'is', null)
      .range(from, from + 999);
    if (error) throw error;
    for (const r of data) byCognito.set(r.legacy_cognito_id, r.id);
    if (data.length < 1000) break;
  }
  console.log('members available to attach to:', byCognito.size);
}

const stats = {
  postsRead: posts.length,
  postsSkippedNoBody: 0,
  postsSkippedUnknownAuthor: 0,
  postsSkippedImageOnly: 0,
  postsAlreadyPresent: 0,
  postsCreated: 0,
  commentsCreated: 0,
  commentsSkipped: 0,
  likesCreated: 0,
  likesSkipped: 0,
  failed: 0,
};
const failures = [];

const commentsByChannel = new Map();
for (const c of comments) {
  if (!commentsByChannel.has(c.channel_url)) commentsByChannel.set(c.channel_url, []);
  commentsByChannel.get(c.channel_url).push(c);
}
const likesByChannel = new Map();
for (const l of likes) {
  if (!likesByChannel.has(l.channel_url)) likesByChannel.set(l.channel_url, []);
  likesByChannel.get(l.channel_url).push(l);
}

let handled = 0;
for (const p of posts) {
  if (LIMIT && handled >= LIMIT) break;

  if (!p.body) {
    if (p.image_url) stats.postsSkippedImageOnly += 1;
    else stats.postsSkippedNoBody += 1;
    continue;
  }
  const authorId = DRY_RUN ? 'dry' : byCognito.get(p.author_cognito_id);
  if (!authorId) {
    stats.postsSkippedUnknownAuthor += 1;
    failures.push({ channel: p.channel_url, author: p.author_nickname, reason: 'author not in database' });
    continue;
  }

  handled += 1;
  if (DRY_RUN) {
    stats.postsCreated += 1;
    stats.commentsCreated += (commentsByChannel.get(p.channel_url) ?? []).length;
    stats.likesCreated += (likesByChannel.get(p.channel_url) ?? []).length;
    continue;
  }

  // Already imported?
  const { data: existing } = await sb
    .from('posts')
    .select('id')
    .eq('legacy_channel_url', p.channel_url)
    .maybeSingle();

  let postId = existing?.id;
  if (postId) {
    stats.postsAlreadyPresent += 1;
  } else {
    const { data: created, error } = await sb
      .from('posts')
      .insert({
        author_id: authorId,
        body: p.body,
        visibility: visibilityFor(p.visibility),
        audience_tags: (p.recommended_groups ?? []).map((t) => String(t).toLowerCase()),
        legacy_channel_url: p.channel_url,
        created_at: p.created_at,
        updated_at: p.created_at,
      })
      .select('id')
      .single();
    if (error) {
      stats.failed += 1;
      failures.push({ channel: p.channel_url, reason: `post: ${error.message}` });
      continue;
    }
    postId = created.id;
    stats.postsCreated += 1;
  }

  for (const c of commentsByChannel.get(p.channel_url) ?? []) {
    const commenter = byCognito.get(c.author_cognito_id);
    if (!commenter) {
      stats.commentsSkipped += 1;
      continue;
    }
    const { error } = await sb.from('comments').insert({
      post_id: postId,
      author_id: commenter,
      body: c.body,
      created_at: c.created_at,
    });
    if (error) stats.commentsSkipped += 1;
    else stats.commentsCreated += 1;
  }

  for (const l of likesByChannel.get(p.channel_url) ?? []) {
    const liker = byCognito.get(l.user_cognito_id);
    if (!liker) {
      stats.likesSkipped += 1;
      continue;
    }
    // reactions has unique (entity_type, entity_id, user_id, kind), so a
    // repeated run collides here rather than double-counting a like.
    const { error } = await sb
      .from('reactions')
      .insert({ entity_type: 'post', entity_id: postId, user_id: liker, kind: 'like' });
    if (error) stats.likesSkipped += 1;
    else stats.likesCreated += 1;
  }

  if (stats.postsCreated % 50 === 0 && stats.postsCreated) console.log(`  …${stats.postsCreated} posts`);
}

console.log(DRY_RUN ? '\nDRY RUN — nothing written.' : '\nDone.');
console.table(stats);
if (failures.length) {
  console.log(`\n${failures.length} row(s) skipped:`);
  for (const f of failures.slice(0, 20)) console.log('  ', JSON.stringify(f));
  if (failures.length > 20) console.log(`  …and ${failures.length - 20} more`);
}
