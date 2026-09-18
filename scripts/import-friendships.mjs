#!/usr/bin/env node
/**
 * Import the legacy friend graph.
 *
 *   node scripts/import-friendships.mjs --file <dir>/friendships.ndjson --dry-run
 *   node scripts/import-friendships.mjs --file <dir>/friendships.ndjson
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Members must be imported
 * first — both sides of every edge are resolved through `legacy_cognito_id`.
 *
 * The old `friend_request` table and the new `friendships` table have the same
 * shape, so this is a direct mapping. The work is in the edge cases:
 *
 *   · both parties must exist, and 13 legacy posters do not (deleted accounts)
 *   · `requester_id <> addressee_id` is enforced, so any self-edge is dropped
 *   · `unique (requester_id, addressee_id)` catches repeats in one direction,
 *     but A->B and B->A are two distinct rows the constraint allows. A pair
 *     that already exists in either direction is skipped, because two rows for
 *     one friendship means the app shows a pending request between people who
 *     are already connected.
 *   · 'pending' is carried across rather than quietly accepted. 223 of 292 are
 *     requests nobody ever answered; converting them to friendships would
 *     fabricate relationships that never existed.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const arg = (n, d = null) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? d : args[i + 1];
};
const FILE = arg('file');
const DRY_RUN = args.includes('--dry-run');

if (!FILE) {
  console.error('usage: node scripts/import-friendships.mjs --file <path> [--dry-run]');
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

const rows = readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

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
  console.log('members available:', byCognito.size);
}

const stats = {
  read: rows.length,
  created: 0,
  skippedUnknownParty: 0,
  skippedSelfEdge: 0,
  skippedDuplicate: 0,
  failed: 0,
};
const byStatus = {};
const seenPairs = new Set();

for (const r of rows) {
  const a = r.requester_cognito_id;
  const b = r.addressee_cognito_id;

  if (!a || !b) {
    stats.skippedUnknownParty += 1;
    continue;
  }
  if (a === b) {
    stats.skippedSelfEdge += 1;
    continue;
  }

  // Direction-independent key: one friendship, however it was recorded.
  const key = [a, b].sort().join('|');
  if (seenPairs.has(key)) {
    stats.skippedDuplicate += 1;
    continue;
  }
  seenPairs.add(key);

  const status = r.status === 'accepted' ? 'accepted' : 'pending';

  if (DRY_RUN) {
    stats.created += 1;
    byStatus[status] = (byStatus[status] ?? 0) + 1;
    continue;
  }

  const requesterId = byCognito.get(a);
  const addresseeId = byCognito.get(b);
  if (!requesterId || !addresseeId) {
    stats.skippedUnknownParty += 1;
    continue;
  }

  const { error } = await sb.from('friendships').insert({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status,
    created_at: r.created_at,
    updated_at: r.created_at,
  });

  if (error) {
    // A pair already present in either direction lands here on the unique
    // constraint, which is the desired outcome for a repeated run.
    if (String(error.message).includes('duplicate key')) stats.skippedDuplicate += 1;
    else {
      stats.failed += 1;
      console.log('  failed:', error.message.slice(0, 100));
    }
    continue;
  }
  stats.created += 1;
  byStatus[status] = (byStatus[status] ?? 0) + 1;
}

console.log(DRY_RUN ? '\nDRY RUN — nothing written.' : '\nDone.');
console.table(stats);
console.log('by status:', byStatus);
