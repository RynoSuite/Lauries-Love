#!/usr/bin/env node
/**
 * Import the legacy members into Supabase.
 *
 *   node scripts/import-legacy.mjs --file users.ndjson --dry-run
 *   node scripts/import-legacy.mjs --file users.ndjson --limit 25
 *   node scripts/import-legacy.mjs --file users.ndjson
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment. The
 * service role bypasses RLS, which is the only way to write another person's
 * profile — so this script must never be given to anyone who does not already
 * have that key, and the key must never be committed.
 *
 * What it does per member:
 *   1. creates an auth user with a random password, email pre-confirmed
 *   2. writes the public half of the profile
 *   3. writes email, phone and zip to profiles_private
 *
 * Nobody's password comes across: Cognito never exposed them. Every member
 * resets on first sign-in, which is why this sets a random password rather
 * than a shared one — a known password on 2,221 accounts is a breach waiting
 * for the first person who reads the script.
 *
 * Idempotent. `legacy_id` carries the old MySQL id, and a member who already
 * has a profile with that id is skipped, so a run that dies half way through
 * can simply be run again. That matters more than speed here: this touches
 * real people's accounts and will be run against production exactly once, but
 * against staging several times.
 *
 * Rehearse against staging (hcvyknwbixnlwqozmkas) before production.
 */

import { createReadStream } from 'node:fs';
import { createRequire } from 'node:module';
import { createInterface } from 'node:readline';
import { randomUUID } from 'node:crypto';

const args = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const flag = (name) => args.includes(`--${name}`);

const FILE = arg('file');
const LIMIT = Number(arg('limit', '0')) || 0;
const DRY_RUN = flag('dry-run');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!FILE) {
  console.error('Usage: node scripts/import-legacy.mjs --file users.ndjson [--dry-run] [--limit N]');
  process.exit(1);
}
if (!DRY_RUN && (!SUPABASE_URL || !SERVICE_KEY)) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (or pass --dry-run).');
  process.exit(1);
}

/**
 * Resolved from the web app, which already depends on supabase-js, and only
 * when there is something to write. A dry run needs no install at all, which
 * is the point: the mapping can be checked against the real export on any
 * machine before anything is connected to a database.
 */
function connect() {
  const require = createRequire(new URL('../web/package.json', import.meta.url));
  const { createClient } = require('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const supabase = DRY_RUN ? null : connect();

/**
 * The legacy age and gender vocabularies are not the ones the apps use.
 *
 * See PROJECT-STATUS §1a: web and mobile already disagree with each other,
 * and mobile's set is the canon because it is what these very members have
 * been using. Anything that does not map is carried across as null rather
 * than guessed at — a wrong age bracket is worse than an empty one, because
 * it looks like an answer.
 */
const AGE_RANGES = ['18-34', '35-44', '45-59', '60-plus'];

function normaliseAge(value) {
  if (!value) return null;
  const raw = String(value).trim().toLowerCase();
  if (AGE_RANGES.includes(raw)) return raw;

  // Some rows hold a number rather than a bracket.
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0 && n < 120) {
    if (n < 35) return '18-34';
    if (n < 45) return '35-44';
    if (n < 60) return '45-59';
    return '60-plus';
  }

  const compact = raw.replace(/\s|_/g, '');
  if (compact === '60+' || compact === '60plus') return '60-plus';
  if (AGE_RANGES.includes(compact)) return compact;
  return null;
}

function normaliseGender(value) {
  if (!value) return null;
  const raw = String(value).trim().toLowerCase();
  if (['female', 'male', 'non-binary', 'prefer-not-to-say'].includes(raw)) return raw;
  if (raw === 'f' || raw === 'woman') return 'female';
  if (raw === 'm' || raw === 'man') return 'male';
  if (raw.startsWith('non')) return 'non-binary';
  if (raw.startsWith('prefer')) return 'prefer-not-to-say';
  return null;
}

/**
 * Coordinates are rounded to the same ~3.5 mile grid the app rounds to on
 * write, so imported members are no more precisely located than members who
 * signed up yesterday. Importing the exact values and relying on the trigger
 * to round them would leave the precise figure in the WAL and in any backup
 * taken before the next vacuum.
 */
const GRID = 0.05;
const coarsen = (n) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.round(n / GRID) * GRID : null;

function parseGeo(raw) {
  if (!raw) return { latitude: null, longitude: null };
  try {
    const g = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return {
      latitude: coarsen(Number(g?.latitude ?? g?.lat)),
      longitude: coarsen(Number(g?.longitude ?? g?.lng ?? g?.lon)),
    };
  } catch {
    return { latitude: null, longitude: null };
  }
}

const clean = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' || s.toLowerCase() === 'null' ? null : s;
};

const stats = {
  read: 0,
  skippedNoEmail: 0,
  skippedDuplicateEmail: 0,
  skippedAlreadyImported: 0,
  created: 0,
  failed: 0,
  unmappedAge: 0,
  unmappedGender: 0,
};
const failures = [];
const seenEmails = new Set();

async function importMember(row) {
  const email = clean(row.email)?.toLowerCase();
  const legacyId = String(row.id);

  // Without an email there is no account to create and no way for the member
  // to ever reach it: Supabase auth is email-keyed and nobody's password came
  // across. Reported rather than dropped silently.
  if (!email) {
    stats.skippedNoEmail += 1;
    failures.push({ legacyId, reason: 'no email' });
    return;
  }
  if (seenEmails.has(email)) {
    stats.skippedDuplicateEmail += 1;
    failures.push({ legacyId, email, reason: 'duplicate email in export' });
    return;
  }
  seenEmails.add(email);

  const age = normaliseAge(row.age);
  const gender = normaliseGender(row.gender);
  if (row.age && !age) stats.unmappedAge += 1;
  if (row.gender && !gender) stats.unmappedGender += 1;

  const { latitude, longitude } = parseGeo(row.geo_location);

  if (DRY_RUN) {
    stats.created += 1;
    return;
  }

  // Already here from an earlier run?
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('legacy_id', legacyId)
    .maybeSingle();
  if (existing) {
    stats.skippedAlreadyImported += 1;
    return;
  }

  const { data: created, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      // Random and discarded. Every member arrives through password reset.
      password: randomUUID() + randomUUID(),
      email_confirm: true,
      user_metadata: {
        legacy_id: legacyId,
        legacy_cognito_id: clean(row.cognito_id),
      },
    });

  if (authError || !created?.user) {
    stats.failed += 1;
    failures.push({ legacyId, email, reason: authError?.message ?? 'no user returned' });
    return;
  }

  const id = created.user.id;

  // handle_new_user() has already created both rows from the auth trigger, so
  // this updates rather than inserts — inserting here is what produced
  // "duplicate key value violates profiles_pkey" during the seed work.
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      first_name: clean(row.first_name),
      last_name: clean(row.last_name),
      display_name: clean(row.display_name),
      diagnosis_year: clean(row.diagnosis_year),
      age_range: age,
      gender,
      description: clean(row.description),
      city: clean(row.city),
      state: clean(row.state),
      country: clean(row.country),
      latitude,
      longitude,
      active: row.active === 1 || row.active === true || row.active === '1',
      legacy_id: legacyId,
      legacy_cognito_id: clean(row.cognito_id),
    })
    .eq('id', id);

  if (profileError) {
    stats.failed += 1;
    failures.push({ legacyId, email, reason: `profile: ${profileError.message}` });
    return;
  }

  const { error: privateError } = await supabase
    .from('profiles_private')
    .update({
      email,
      phone_number: clean(row.phone_number),
      phone_number_location: clean(row.phone_number_location),
      zip_code: clean(row.zip_code),
    })
    .eq('profile_id', id);

  if (privateError) {
    stats.failed += 1;
    failures.push({ legacyId, email, reason: `private: ${privateError.message}` });
    return;
  }

  stats.created += 1;
}

const rl = createInterface({
  input: createReadStream(FILE, 'utf8'),
  crlfDelay: Infinity,
});

console.log(
  DRY_RUN
    ? 'Dry run: parsing and mapping only, nothing is written.'
    : `Importing into ${SUPABASE_URL}`,
);

for await (const line of rl) {
  const text = line.trim();
  if (!text) continue;
  if (LIMIT && stats.read >= LIMIT) break;
  stats.read += 1;

  let row;
  try {
    row = JSON.parse(text);
  } catch {
    stats.failed += 1;
    failures.push({ line: stats.read, reason: 'unparseable JSON' });
    continue;
  }

  try {
    await importMember(row);
  } catch (error) {
    stats.failed += 1;
    failures.push({ legacyId: row?.id, reason: error.message });
  }

  if (stats.read % 100 === 0) console.log(`  …${stats.read} rows`);
}

console.log('\nDone.');
console.table(stats);

if (failures.length) {
  console.log(`\n${failures.length} row(s) need a human:`);
  for (const f of failures.slice(0, 40)) console.log(' ', JSON.stringify(f));
  if (failures.length > 40) console.log(`  …and ${failures.length - 40} more`);
}

// Unmapped values are worth a second look before production: they are members
// whose age or gender will simply be blank, and it may be a vocabulary the
// mapping above should learn rather than a genuinely empty field.
if (stats.unmappedAge || stats.unmappedGender) {
  console.log(
    `\n${stats.unmappedAge} age and ${stats.unmappedGender} gender value(s) did not map ` +
      'and were imported as empty. Check whether the legacy vocabulary needs adding to ' +
      'normaliseAge/normaliseGender before running this against production.',
  );
}
