#!/usr/bin/env node
/**
 * Backfill the posts and comments recovered from the legacy notification
 * tables.
 *
 *   node scripts/import-recovered-content.mjs --dir <export-dir> --dry-run
 *   node scripts/import-recovered-content.mjs --dir <export-dir>
 *
 * Run AFTER import-legacy.mjs and import-sendbird.mjs. Reads posts.ndjson
 * (Sendbird), recovered-posts.ndjson and recovered-comments.ndjson.
 *
 * Two sources, joined on the Sendbird channel url:
 *
 *   · Sendbird kept the AUTHOR and the timestamp for all 495 posts, but lost
 *     160 bodies to message retention.
 *   · The notification tables kept the TEXT, but a post body is quoted in a
 *     NEW_LIKE notification whose actor is the liker, not the author.
 *
 * So neither source alone can rebuild a post, and together they can.
 *
 * Comments come with their own author: NEW_MESSAGE's actor IS the commenter,
 * and `notification_change.actor_id` is `user.id`, which the member import
 * stored as `profiles.legacy_id`.
 *
 * Idempotent. Posts collide on `legacy_channel_url`; comments are matched on
 * post + author + body before inserting, because the 43 comments that survived
 * in Sendbird are also present in the notification export.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const arg = (n, d = null) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? d : args[i + 1];
};
const DIR = arg('dir');
const DRY_RUN = args.includes('--dry-run');

if (!DIR) {
  console.error('usage: node scripts/import-recovered-content.mjs --dir <export-dir> [--dry-run]');
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

const sendbirdPosts = read('posts.ndjson');
const recoveredBodies = new Map(read('recovered-posts.ndjson').map((r) => [r.channel_url, r.body]));
const recoveredComments = read('recovered-comments.ndjson');

const byCognito = new Map(); // post authors
const byLegacyId = new Map(); // comment authors
if (!DRY_RUN) {
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from('profiles')
      .select('id, legacy_cognito_id, legacy_id')
      .not('legacy_id', 'is', null)
      .range(from, from + 999);
    if (error) throw error;
    for (const r of data) {
      if (r.legacy_cognito_id) byCognito.set(r.legacy_cognito_id, r.id);
      if (r.legacy_id) byLegacyId.set(String(r.legacy_id), r.id);
    }
    if (data.length < 1000) break;
  }
  console.log('members resolvable:', byCognito.size, 'by cognito id,', byLegacyId.size, 'by legacy id');
}

const stats = {
  postsMissingBody: 0,
  postsRecovered: 0,
  postsNoRecoveredText: 0,
  postsUnknownAuthor: 0,
  postsAlreadyPresent: 0,
  commentsRead: recoveredComments.length,
  commentsCreated: 0,
  commentsAlreadyPresent: 0,
  commentsNoPost: 0,
  commentsUnknownAuthor: 0,
  failed: 0,
};

// ── Rebuild the posts that lost their body ────────────────────────────────
for (const p of sendbirdPosts) {
  if (p.body) continue; // Sendbird still had it; already imported.
  stats.postsMissingBody += 1;

  const body = recoveredBodies.get(p.channel_url);
  if (!body) {
    stats.postsNoRecoveredText += 1;
    continue;
  }
  if (!p.author_cognito_id || (!DRY_RUN && !byCognito.get(p.author_cognito_id))) {
    stats.postsUnknownAuthor += 1;
    continue;
  }
  if (DRY_RUN) {
    stats.postsRecovered += 1;
    continue;
  }

  const { data: existing } = await sb
    .from('posts')
    .select('id')
    .eq('legacy_channel_url', p.channel_url)
    .maybeSingle();
  if (existing) {
    stats.postsAlreadyPresent += 1;
    continue;
  }

  const { error } = await sb.from('posts').insert({
    author_id: byCognito.get(p.author_cognito_id),
    body,
    visibility: p.visibility === 'group' ? 'group' : 'all',
    audience_tags: (p.recommended_groups ?? []).map((t) => String(t).toLowerCase()),
    legacy_channel_url: p.channel_url,
    created_at: p.created_at,
    updated_at: p.created_at,
  });
  if (error) {
    stats.failed += 1;
    console.log('  post failed:', error.message.slice(0, 90));
    continue;
  }
  stats.postsRecovered += 1;
  if (stats.postsRecovered % 25 === 0) console.log(`  …${stats.postsRecovered} posts rebuilt`);
}

// ── Comments ──────────────────────────────────────────────────────────────
// Resolved per channel so each post is looked up once rather than per comment.
const postIdByChannel = new Map();
const existingByPost = new Map();

for (const c of recoveredComments) {
  if (DRY_RUN) {
    stats.commentsCreated += 1;
    continue;
  }

  if (!postIdByChannel.has(c.channel_url)) {
    const { data } = await sb
      .from('posts')
      .select('id')
      .eq('legacy_channel_url', c.channel_url)
      .maybeSingle();
    postIdByChannel.set(c.channel_url, data?.id ?? null);
  }
  const postId = postIdByChannel.get(c.channel_url);
  if (!postId) {
    stats.commentsNoPost += 1;
    continue;
  }

  const authorId = byLegacyId.get(String(c.author_legacy_id));
  if (!authorId) {
    stats.commentsUnknownAuthor += 1;
    continue;
  }

  // The 43 comments Sendbird still had are also in this export, so match on
  // author + text before inserting rather than trusting the source to be new.
  if (!existingByPost.has(postId)) {
    const { data } = await sb.from('comments').select('author_id, body').eq('post_id', postId);
    existingByPost.set(postId, new Set((data ?? []).map((r) => `${r.author_id}|${r.body.trim()}`)));
  }
  const seen = existingByPost.get(postId);
  const key = `${authorId}|${c.body.trim()}`;
  if (seen.has(key)) {
    stats.commentsAlreadyPresent += 1;
    continue;
  }

  const { error } = await sb.from('comments').insert({
    post_id: postId,
    author_id: authorId,
    body: c.body,
    created_at: c.created_at,
  });
  if (error) {
    stats.failed += 1;
    continue;
  }
  seen.add(key);
  stats.commentsCreated += 1;
  if (stats.commentsCreated % 100 === 0) console.log(`  …${stats.commentsCreated} comments`);
}

console.log(DRY_RUN ? '\nDRY RUN — nothing written.' : '\nDone.');
console.table(stats);
