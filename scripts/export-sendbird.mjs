#!/usr/bin/env node
/**
 * Export the legacy community feed from Sendbird to NDJSON.
 *
 *   SENDBIRD_TOKEN=... node scripts/export-sendbird.mjs <output-directory>
 *
 * Read-only. Writes posts.ndjson, comments.ndjson and likes.ndjson.
 *
 * ── The trap ───────────────────────────────────────────────────────────────
 *
 * Posts are NOT Sendbird messages. Each post is a GROUP CHANNEL whose `data`
 * field holds JSON:
 *
 *   {"type":"post","visibility":"public","recommendedGroups":["warrior (patient)"],
 *    "likes":["<uuid>",...],"commentQty":4,"firstMessage":"<the body>",
 *    "firstMessageId":123,"image_sm":"https://...","image_md":"https://..."}
 *
 * Query /messages alone and you get a handful of results and conclude the
 * community is dead. The feed is in /group_channels, in `.data`.
 *
 * ── What survives, and what does not ───────────────────────────────────────
 *
 * MIGRATION-RUNBOOK §5 says all 494 post bodies survived because channel
 * `data` is not subject to message retention. That is only half right.
 * `firstMessage` was not always written: 160 posts created between Dec 2024
 * and Apr 2025 have no body in `data`, no `firstMessageId`, and no messages
 * left in the channel — retention (4380h, ~6 months) deleted the originals
 * long ago. Those 160 are unrecoverable. The cache appears to have been added
 * to the old app around mid-March 2025, which is where the two populations
 * meet.
 *
 * Comments live as ordinary messages, so they survive only inside the
 * retention window — roughly the last six months. `commentQty` records how
 * many there once were, and the gap between it and what comes back is the
 * measure of what is gone.
 *
 * Author is `created_by.user_id`, which is the Cognito sub — the same value as
 * `profiles.legacy_cognito_id`. That is the join into the new database.
 */
import { createWriteStream } from 'node:fs';

const OUT = process.argv[2];
const TOKEN = process.env.SENDBIRD_TOKEN;
const APP = process.env.SENDBIRD_APP_ID || 'EAD0FC5B-45E7-4029-90C1-32730AC76B5D';

if (!OUT || !TOKEN) {
  console.error('usage: SENDBIRD_TOKEN=... node scripts/export-sendbird.mjs <output-directory>');
  console.error('token: Sendbird Dashboard -> Settings -> Application -> API tokens');
  process.exit(1);
}

const BASE = `https://api-${APP}.sendbird.com/v3`;

async function api(path, attempt = 0) {
  const res = await fetch(BASE + path, { headers: { 'Api-Token': TOKEN } });
  // Sendbird rate-limits the platform API; back off rather than lose rows.
  if (res.status === 429 && attempt < 5) {
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    return api(path, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} on ${path}`);
  return res.json();
}

// ── Every group channel, paginated ─────────────────────────────────────────
const channels = [];
let token = '';
for (let page = 0; page < 100; page++) {
  const data = await api(
    `/group_channels?limit=100&show_empty=true&show_member=false${token ? `&token=${token}` : ''}`,
  );
  channels.push(...(data.channels ?? []));
  if (!data.next) break;
  token = data.next;
}
console.log('group channels:', channels.length);

const postChannels = [];
for (const c of channels) {
  if (!c.data) continue;
  let d;
  try {
    d = JSON.parse(c.data);
  } catch {
    continue;
  }
  if (d.type === 'post') postChannels.push({ c, d });
}
console.log('post channels:', postChannels.length);

const postsOut = createWriteStream(`${OUT}/posts.ndjson`, { encoding: 'utf8' });
const commentsOut = createWriteStream(`${OUT}/comments.ndjson`, { encoding: 'utf8' });
const likesOut = createWriteStream(`${OUT}/likes.ndjson`, { encoding: 'utf8' });

const stats = {
  posts: 0,
  postsWithBody: 0,
  postsImageOnly: 0,
  postsUnrecoverable: 0,
  likes: 0,
  commentsClaimed: 0,
  commentsRecovered: 0,
};

for (const [i, { c, d }] of postChannels.entries()) {
  if (i % 50 === 0) console.log(`  …${i} channels`);

  const body = d.firstMessage ? String(d.firstMessage) : null;
  const image = d.image_md || d.image_sm || null;

  stats.posts += 1;
  if (body) stats.postsWithBody += 1;
  else if (image) stats.postsImageOnly += 1;
  else stats.postsUnrecoverable += 1;

  postsOut.write(
    JSON.stringify({
      channel_url: c.channel_url,
      author_cognito_id: c.created_by?.user_id ?? null,
      author_nickname: c.created_by?.nickname ?? null,
      created_at: new Date(c.created_at * 1000).toISOString(),
      body,
      image_url: image,
      image_sm: d.image_sm ?? null,
      // `visibility` is absent on 267 of them; the importer decides the
      // default rather than this file inventing one.
      visibility: d.visibility ?? null,
      recommended_groups: (d.recommendedGroups ?? []).filter(Boolean),
      comment_qty_claimed: Number(d.commentQty) || 0,
      recoverable: Boolean(body || image),
    }) + '\n',
  );

  // Likes are an array of user ids on the channel data.
  for (const userId of d.likes ?? []) {
    if (!userId) continue;
    stats.likes += 1;
    likesOut.write(
      JSON.stringify({ channel_url: c.channel_url, user_cognito_id: userId }) + '\n',
    );
  }

  // Comments are messages. The first message in the channel is the post body
  // itself, identified by firstMessageId where that was recorded; where it was
  // not, the oldest message is the body and is skipped by position.
  stats.commentsClaimed += Number(d.commentQty) || 0;
  if (!(Number(d.commentQty) > 0)) continue;

  let messages = [];
  try {
    const res = await api(
      `/group_channels/${encodeURIComponent(c.channel_url)}/messages?message_ts=0&prev_limit=0&next_limit=200`,
    );
    messages = res.messages ?? [];
  } catch {
    continue;
  }

  messages.sort((a, b) => a.created_at - b.created_at);
  const firstId = d.firstMessageId != null ? String(d.firstMessageId) : null;

  for (const [index, m] of messages.entries()) {
    const isBody = firstId ? String(m.message_id) === firstId : index === 0;
    if (isBody) continue;
    const text = String(m.message ?? '').trim();
    if (!text) continue;
    stats.commentsRecovered += 1;
    commentsOut.write(
      JSON.stringify({
        channel_url: c.channel_url,
        author_cognito_id: m.user?.user_id ?? null,
        author_nickname: m.user?.nickname ?? null,
        body: text,
        created_at: new Date(m.created_at).toISOString(),
      }) + '\n',
    );
  }
}

await Promise.all(
  [postsOut, commentsOut, likesOut].map((s) => new Promise((r) => s.end(r))),
);

console.log('\n', stats);
console.log(
  `\ncomments lost to retention: ${stats.commentsClaimed - stats.commentsRecovered} of ${stats.commentsClaimed} claimed`,
);
