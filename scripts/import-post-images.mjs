#!/usr/bin/env node
/**
 * Move the legacy post images from S3 into Supabase Storage.
 *
 *   node scripts/import-post-images.mjs --dir <export-dir> --dry-run
 *   node scripts/import-post-images.mjs --dir <export-dir>
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Run AFTER
 * import-sendbird.mjs — images attach to posts by `legacy_channel_url`.
 *
 * The source bucket `laurieslove-post-prod` is public, so no AWS credentials
 * are needed: the URLs in the export are fetched over HTTPS. (The AVATAR
 * bucket is not public — 403 — so the 222 profile photos need either AWS
 * credentials or a public-read grant, and are not handled here.)
 *
 * Paths follow the app's own convention, `<author_uid>/<timestamp>.<ext>`,
 * because the storage policies require the first segment to be the owner's
 * uid. The service role bypasses those policies on the way in, but the author
 * still has to be able to delete their own image afterwards.
 *
 * The timestamp comes from the post's creation time rather than now(), so a
 * repeated run computes the same path instead of orphaning the first upload.
 *
 * Also imports the 2 image-only posts that import-sendbird.mjs deferred: they
 * have no text body, which is legitimate for a photo post but pointless before
 * the photo exists.
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
  console.error('usage: node scripts/import-post-images.mjs --dir <export-dir> [--dry-run]');
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

const posts = readFileSync(`${DIR}/posts.ndjson`, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l))
  .filter((p) => p.image_url);

console.log('posts carrying an image:', posts.length);

const stats = {
  read: posts.length,
  uploaded: 0,
  alreadyDone: 0,
  postCreated: 0,
  skippedNoPost: 0,
  skippedUnknownAuthor: 0,
  fetchFailed: 0,
  uploadFailed: 0,
};

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
}

const extOf = (url) => {
  const m = String(url).toLowerCase().match(/\.(jpe?g|png|gif|webp)(?:\?|$)/);
  return m ? (m[1] === 'jpeg' ? 'jpg' : m[1]) : 'jpg';
};
const typeOf = (ext) =>
  ({ jpg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' })[ext];

let handled = 0;
for (const p of posts) {
  if (LIMIT && handled >= LIMIT) break;
  handled += 1;

  if (DRY_RUN) {
    stats.uploaded += 1;
    continue;
  }

  const { data: existing } = await sb
    .from('posts')
    .select('id, author_id, image_path')
    .eq('legacy_channel_url', p.channel_url)
    .maybeSingle();

  let post = existing;

  // The image-only posts were deferred rather than imported. Now that the
  // picture is about to exist, the post is worth having: body is an empty
  // string, which the NOT NULL column allows and a photo post does not need.
  if (!post) {
    if (p.body) {
      stats.skippedNoPost += 1;
      continue;
    }
    const authorId = byCognito.get(p.author_cognito_id);
    if (!authorId) {
      stats.skippedUnknownAuthor += 1;
      continue;
    }
    const { data: created, error } = await sb
      .from('posts')
      .insert({
        author_id: authorId,
        body: '',
        visibility: p.visibility === 'group' ? 'group' : 'all',
        audience_tags: (p.recommended_groups ?? []).map((t) => String(t).toLowerCase()),
        legacy_channel_url: p.channel_url,
        created_at: p.created_at,
        updated_at: p.created_at,
      })
      .select('id, author_id, image_path')
      .single();
    if (error) {
      stats.skippedNoPost += 1;
      continue;
    }
    post = created;
    stats.postCreated += 1;
  }

  if (post.image_path) {
    stats.alreadyDone += 1;
    continue;
  }

  let bytes;
  try {
    const res = await fetch(p.image_url);
    if (!res.ok) throw new Error(String(res.status));
    bytes = Buffer.from(await res.arrayBuffer());
  } catch (e) {
    stats.fetchFailed += 1;
    console.log('  fetch failed:', p.image_url.slice(-44), String(e.message).slice(0, 40));
    continue;
  }

  const ext = extOf(p.image_url);
  const path = `${post.author_id}/${Date.parse(p.created_at)}.${ext}`;

  const { error: upErr } = await sb.storage
    .from('post-images')
    .upload(path, bytes, { contentType: typeOf(ext), upsert: true });
  if (upErr) {
    stats.uploadFailed += 1;
    console.log('  upload failed:', path, upErr.message.slice(0, 60));
    continue;
  }

  const { error: updErr } = await sb.from('posts').update({ image_path: path }).eq('id', post.id);
  if (updErr) {
    stats.uploadFailed += 1;
    continue;
  }
  stats.uploaded += 1;
  if (stats.uploaded % 10 === 0) console.log(`  …${stats.uploaded} images`);
}

console.log(DRY_RUN ? '\nDRY RUN — nothing written.' : '\nDone.');
console.table(stats);
