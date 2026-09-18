#!/usr/bin/env node
/**
 * Import the legacy members' diagnoses.
 *
 *   node scripts/import-diagnoses.mjs --dir <export-dir> --dry-run
 *   node scripts/import-diagnoses.mjs --dir <export-dir>
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, and
 * 20260918120000_diagnosis_vocabulary_v1.sql must have been applied first —
 * this script maps onto `value_definitions` and refuses to run if the
 * vocabulary is incomplete, rather than silently dropping diagnoses the way the
 * original member import did.
 *
 * Reads diagnosis-types.ndjson and diagnosis-subtypes.ndjson, joins
 * `user_id` -> profiles.legacy_id, and writes profiles.diagnosis_type_ids and
 * diagnosis_subtype_ids.
 *
 * ── Why this is a separate pass ────────────────────────────────────────────
 *
 * `import-legacy.mjs` wrote `diagnosis_year` but never the diagnosis itself,
 * because at the time `value_definitions` held 11 of the 36 types the old
 * platform offered and there was nowhere to put most of them. 2,105 members
 * kept their diagnosis in the export and lost it on the way in. This is the
 * repair.
 *
 * Mapping is by LABEL, with an explicit alias map for the handful whose wording
 * differs, because a legacy code means nothing in the new vocabulary and one
 * `legacy_id` column cannot record the two source codes that Ovarian Cancer has.
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
  console.error('usage: node scripts/import-diagnoses.mjs --dir <export-dir> [--dry-run]');
  process.exit(1);
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

const require = createRequire(new URL('../web/package.json', import.meta.url));
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const read = (f) =>
  readFileSync(`${DIR}/${f}`, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

const norm = (s) => String(s ?? '').trim().toLowerCase();

/**
 * Legacy label -> the label to use in the new vocabulary.
 *
 * Only the ones that differ. Everything else matches on its own, including the
 * two legacy "Ovarian Cancer" rows, which collapse onto one entry here and
 * repair a split the old database has always had.
 */
const ALIASES = new Map(
  Object.entries({
    // Wording differs; same disease. Adding a second row would put two
    // identical-looking options in the picker and split their members.
    'colorectal (bowel) cancer': 'Colorectal Cancer',
    'leukemia (cml, cll, aml, all...)': 'Leukemia',
    // DCIS is Ductal CARCINOMA In Situ. "Ductal Sarcoma" is a different disease
    // entirely — see the migration. Both legacy spellings land on one row.
    'ductal sarcoma (dcis)': 'Ductal Carcinoma In Situ (DCIS)',
    'ductal sarcoma in situ (dcis)': 'Ductal Carcinoma In Situ (DCIS)',
    'pyhllodes tumor': 'Phyllodes Tumor',
    // Case-only differences in the legacy data.
    'her2 positive': 'HER2 Positive',
    'triple negative': 'Triple Negative',
  }).map(([k, v]) => [k, norm(v)]),
);

const { data: defs, error: defErr } = await sb
  .from('value_definitions')
  .select('id, definition_type, description')
  .in('definition_type', ['DIAGNOSIS_TYPE', 'DIAGNOSIS_SUB_TYPE']);
if (defErr) throw defErr;

const byLabel = {
  DIAGNOSIS_TYPE: new Map(),
  DIAGNOSIS_SUB_TYPE: new Map(),
};
for (const d of defs) byLabel[d.definition_type].set(norm(d.description), d.id);

console.log(
  'vocabulary:',
  byLabel.DIAGNOSIS_TYPE.size,
  'types,',
  byLabel.DIAGNOSIS_SUB_TYPE.size,
  'subtypes',
);

const resolve = (type, label) => {
  const key = ALIASES.get(norm(label)) ?? norm(label);
  return byLabel[type].get(key) ?? null;
};

// Fail before touching anything if the vocabulary is short — a missing label
// would otherwise drop that member's diagnosis without anyone noticing, which
// is exactly how this got missed the first time.
const unmapped = new Set();
const typeRows = read('diagnosis-types.ndjson');
const subRows = read('diagnosis-subtypes.ndjson');
for (const r of typeRows) if (!resolve('DIAGNOSIS_TYPE', r.label)) unmapped.add(`TYPE: ${r.label}`);
for (const r of subRows) if (!resolve('DIAGNOSIS_SUB_TYPE', r.label)) unmapped.add(`SUBTYPE: ${r.label}`);

if (unmapped.size) {
  console.error(`\n${unmapped.size} legacy label(s) have nowhere to go:`);
  for (const u of unmapped) console.error('  ', u);
  console.error('\nApply supabase/migrations/20260918120000_diagnosis_vocabulary_v1.sql first.');
  process.exit(1);
}
console.log('every legacy label maps.');

// legacy user.id -> profile id
const byLegacyId = new Map();
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb
    .from('profiles')
    .select('id, legacy_id')
    .not('legacy_id', 'is', null)
    .range(from, from + 999);
  if (error) throw error;
  for (const r of data) byLegacyId.set(String(r.legacy_id), r.id);
  if (data.length < 1000) break;
}
console.log('members resolvable:', byLegacyId.size);

// Collect per member, de-duplicated — the two Ovarian codes collapse onto one
// id here, and a member who held both would otherwise get it twice.
const perMember = new Map();
const add = (legacyUserId, field, id) => {
  const profileId = byLegacyId.get(String(legacyUserId));
  if (!profileId) return false;
  if (!perMember.has(profileId)) perMember.set(profileId, { types: new Set(), subs: new Set() });
  perMember.get(profileId)[field].add(id);
  return true;
};

const stats = { typeRows: typeRows.length, subRows: subRows.length, orphanRows: 0, membersUpdated: 0, failed: 0 };
for (const r of typeRows) if (!add(r.user_id, 'types', resolve('DIAGNOSIS_TYPE', r.label))) stats.orphanRows += 1;
for (const r of subRows) if (!add(r.user_id, 'subs', resolve('DIAGNOSIS_SUB_TYPE', r.label))) stats.orphanRows += 1;

console.log('members with at least one diagnosis:', perMember.size);

if (DRY_RUN) {
  console.log('\nDRY RUN — nothing written.');
  console.table(stats);
  process.exit(0);
}

for (const [profileId, sets] of perMember) {
  const { error } = await sb
    .from('profiles')
    .update({
      diagnosis_type_ids: [...sets.types],
      diagnosis_subtype_ids: [...sets.subs],
    })
    .eq('id', profileId);
  if (error) {
    stats.failed += 1;
    if (stats.failed < 5) console.log('  failed:', error.message.slice(0, 90));
    continue;
  }
  stats.membersUpdated += 1;
  if (stats.membersUpdated % 250 === 0) console.log(`  …${stats.membersUpdated} members`);
}

console.log('\nDone.');
console.table(stats);
