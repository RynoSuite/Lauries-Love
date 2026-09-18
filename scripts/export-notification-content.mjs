#!/usr/bin/env node
/**
 * Recover post bodies and comments from the legacy notification tables.
 *
 *   LL_RDS_PASSWORD=... node scripts/export-notification-content.mjs <output-directory>
 *
 * Read-only. Writes recovered-posts.ndjson and recovered-comments.ndjson.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 *
 * Sendbird lost a lot: 160 of 495 post bodies and 740 of 783 comments were
 * deleted by message retention (MIGRATION-RUNBOOK §5). Those were written off
 * as unrecoverable, and that was wrong — the old platform copied the TEXT of
 * every notification into MySQL, and `notification_object.redirect` holds the
 * Sendbird channel url. So the content survives in the notification that
 * announced it.
 *
 * The shape, confirmed against the live data:
 *
 *   notification_object.redirect     'sendbird/<channel_url>'
 *   notification_object.content      the text
 *   notification_object.entity_type_id -> values_definition:
 *      NEW_LIKE           content is the POST BODY, actor is the liker
 *      NEW_MESSAGE        content is the COMMENT,   actor is the commenter
 *      NEW_FRIEND_REQUEST not useful here
 *   notification_change.actor_id     -> user.id  (joins on all 3,457 rows)
 *
 * `user.id` is what the member import stored as `profiles.legacy_id`, so a
 * recovered comment can be attributed to a real account.
 *
 * ── What it does NOT do ────────────────────────────────────────────────────
 *
 * A post body is taken from NEW_LIKE rows, where the actor is whoever pressed
 * like — NOT the author. The author comes from the Sendbird channel's
 * `created_by`, which survived for all 495 posts; only the body was missing.
 * So this file carries no author for posts, and the importer joins the two
 * sources on channel_url.
 *
 * Where several notifications quote the same post, the LONGEST text wins: a
 * couple are truncated with an ellipsis, and the longest copy is the most
 * complete one.
 */
import { createWriteStream } from 'node:fs';
import { createRequire } from 'node:module';

const OUT = process.argv[2];
if (!OUT || !process.env.LL_RDS_PASSWORD) {
  console.error('usage: LL_RDS_PASSWORD=... node scripts/export-notification-content.mjs <dir>');
  console.error('password: AWS Secrets Manager -> LL-Prod/us-east-1/laurieslove-rds-secret');
  process.exit(1);
}

const require = createRequire(import.meta.url);
const mysql = require('mysql2/promise');

const conn = await mysql.createConnection({
  host: 'laurieslove-production-cluster.cluster-ro-cxrztrhnnx8q.us-east-1.rds.amazonaws.com',
  user: 'cesgicid',
  password: process.env.LL_RDS_PASSWORD,
  database: 'laurieslove',
  ssl: { rejectUnauthorized: false },
  connectTimeout: 15000,
  dateStrings: true,
});

const [rows] = await conn.query(`
  select replace(n.redirect, 'sendbird/', '') as channel_url,
         vd.description                      as kind,
         n.content                           as content,
         ch.actor_id                         as actor_legacy_id,
         n.created_at                        as created_at
    from notification_object n
    left join values_definition  vd on vd.id = n.entity_type_id
    left join notification_change ch on ch.id = n.notification_change_id
   where n.redirect like 'sendbird/%'
     and n.content is not null
     and n.content <> ''
   order by n.created_at`);

console.log('notification rows naming a channel:', rows.length);

// ── Post bodies, from the likes ───────────────────────────────────────────
// Longest wins; see the note above.
const bodies = new Map();
for (const r of rows) {
  if (r.kind !== 'NEW_LIKE') continue;
  const text = String(r.content).trim();
  const held = bodies.get(r.channel_url);
  if (!held || text.length > held.body.length) {
    bodies.set(r.channel_url, { channel_url: r.channel_url, body: text, seen_at: r.created_at });
  }
}

const postsOut = createWriteStream(`${OUT}/recovered-posts.ndjson`, { encoding: 'utf8' });
for (const v of bodies.values()) postsOut.write(JSON.stringify(v) + '\n');
await new Promise((r) => postsOut.end(r));
console.log('recovered-posts.ndjson   ', bodies.size, 'post bodies');

// ── Comments, from the messages ───────────────────────────────────────────
// Deduplicated on channel + author + text: the same comment generates one
// notification per recipient, so it appears once for every member watching.
const seen = new Set();
const commentsOut = createWriteStream(`${OUT}/recovered-comments.ndjson`, { encoding: 'utf8' });
let n = 0;
for (const r of rows) {
  if (r.kind !== 'NEW_MESSAGE') continue;
  const body = String(r.content).trim();
  if (!body) continue;
  const key = `${r.channel_url}|${r.actor_legacy_id}|${body}`;
  if (seen.has(key)) continue;
  seen.add(key);
  commentsOut.write(
    JSON.stringify({
      channel_url: r.channel_url,
      author_legacy_id: String(r.actor_legacy_id),
      body,
      created_at: r.created_at,
    }) + '\n',
  );
  n++;
}
await new Promise((r) => commentsOut.end(r));
console.log('recovered-comments.ndjson', n, 'comments');

await conn.end();
