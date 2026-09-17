#!/usr/bin/env node
/**
 * Export the legacy platform to NDJSON.
 *
 *   LL_RDS_PASSWORD=... node scripts/export-legacy.mjs <output-directory>
 *
 * Reads the Aurora MySQL cluster in LL-Prod and writes one file per table,
 * one JSON object per line. SELECT only — nothing here writes.
 *
 * ── Why this exists, and why it is not CloudShell ──────────────────────────
 *
 * MIGRATION-RUNBOOK.md §3 recorded the cluster as unreachable from outside the
 * VPC, which sent two sessions toward CloudShell, S3 gateway endpoints and the
 * paste-mangling workarounds that come with them. That note was taken from the
 * STALE `laurieslove-prod` cluster. The live one — `laurieslove-production-
 * cluster` — sits in the default VPC with `Publicly accessible: Yes` and a
 * security group allowing 3306 from 0.0.0.0/0, so it can be read directly from
 * a laptop. That is a security problem for the client (see the runbook), but it
 * is also why this script is twenty lines instead of an afternoon.
 *
 * ── Why not scripts/export-legacy.sql ──────────────────────────────────────
 *
 * That file was written before anyone could reach the database and guessed
 * TypeORM's camelCase column names — u.roleId, fr.senderId,
 * j.valuesDefinitionId. The live schema is snake_case throughout, so it fails
 * on the first statement. The SQL below is that file's intent, corrected
 * against the real schema.
 *
 * ── Handling ───────────────────────────────────────────────────────────────
 *
 * The output holds names, emails, phone numbers, dates of birth and cancer
 * diagnoses for 2,221 real people. Write it OUTSIDE the repository, keep it
 * local, and delete it once the import is verified. `.gitignore` covers
 * *.ndjson as a second line of defence, not as permission.
 */
import { createWriteStream } from 'node:fs';
import { createRequire } from 'node:module';

const OUT = process.argv[2];
if (!OUT) {
  console.error('usage: LL_RDS_PASSWORD=... node scripts/export-legacy.mjs <output-directory>');
  process.exit(1);
}
if (!process.env.LL_RDS_PASSWORD) {
  console.error('LL_RDS_PASSWORD must be set. It lives in AWS Secrets Manager:');
  console.error('  LL-Prod / us-east-1 / laurieslove-rds-secret');
  process.exit(1);
}

// mysql2 is not a dependency of this repo — it is needed once, for a migration
// that happens twice. `npm install mysql2` in a scratch directory and point
// NODE_PATH at it, or add it temporarily.
const require = createRequire(import.meta.url);
const mysql = require('mysql2/promise');

const conn = await mysql.createConnection({
  // The READER endpoint. The cluster is single-instance so this currently
  // resolves to the writer anyway — read-only is discipline here, not a
  // guarantee the endpoint provides.
  host: 'laurieslove-production-cluster.cluster-ro-cxrztrhnnx8q.us-east-1.rds.amazonaws.com',
  user: 'cesgicid',
  password: process.env.LL_RDS_PASSWORD,
  database: 'laurieslove',
  ssl: { rejectUnauthorized: false },
  connectTimeout: 15000,
  // Dates as strings: the importer wants the stored value, not this machine's
  // timezone applied to it.
  dateStrings: true,
});

async function dump(name, sql) {
  const out = createWriteStream(`${OUT}/${name}.ndjson`, { encoding: 'utf8' });
  let n = 0;
  for await (const row of conn.connection.query(sql).stream()) {
    out.write(JSON.stringify(row) + '\n');
    n++;
  }
  await new Promise((r) => out.end(r));
  console.log(`${name}.ndjson`.padEnd(28), n, 'rows');
  return n;
}

// Members. `active` is carried across rather than filtered: a deactivated
// member still owns posts and friendships, and that decision belongs to the
// importer where it can be logged.
//
// `role` and `designation` are joined out to their labels. Both are near-empty
// in practice — designation_id is NULL for all 2,221, so the warrior/caregiver
// role has no source here at all. See MIGRATION-RUNBOOK.md.
const members = await dump(
  'members',
  `select
     u.id, u.cognito_id, u.email, u.display_name, u.first_name, u.last_name,
     u.phone_number, u.phone_number_location, u.dob, u.address_line1, u.address_line2,
     u.city, u.state, u.country, u.zip_code, u.age, u.gender,
     u.diagnosis_year, u.diagnosis_date, u.timeline, u.description,
     u.profile_picture, u.geo_location, u.config, u.active, u.created_at,
     r.description as role,
     d.description as designation
   from user u
   left join values_definition r on r.id = u.role_id
   left join values_definition d on d.id = u.designation_id`,
);

// Diagnoses as flat join rows, so a member with several does not need a nested
// array the importer would have to unpick.
await dump(
  'diagnosis-types',
  `select j.user_id, vd.value_definition as code, vd.description as label
     from user_diagnosis_types_values_definition j
     join values_definition vd on vd.id = j.values_definition_id`,
);

await dump(
  'diagnosis-subtypes',
  `select j.user_id, vd.value_definition as code, vd.description as label
     from user_diagnosis_sub_types_values_definition j
     join values_definition vd on vd.id = j.values_definition_id`,
);

// Friendships, so the community arrives with its connections intact rather
// than 2,221 people who have never met. Joined out to cognito_id, the key that
// survives into the new system.
await dump(
  'friendships',
  `select s.cognito_id as requester_cognito_id,
          r.cognito_id as addressee_cognito_id,
          fr.status, fr.created_at
     from friend_request fr
     join user s on s.id = fr.sender_id
     join user r on r.id = fr.receiver_id`,
);

// The whole vocabulary, so codes can be mapped without the database.
await dump(
  'definitions',
  `select dt.definition_type as type, vd.value_definition as code, vd.description as label, vd.id
     from values_definition vd
     left join definitions_type dt on dt.id = vd.definition_type_id`,
);

await dump(
  'payments',
  `select p.id, p.payment_id, p.description, p.payment_status, p.amount,
          p.currency_name, p.next_payment, p.in_honor_name, p.created_at,
          u.cognito_id as user_cognito_id
     from payment p left join user u on u.id = p.user_id`,
);

console.log('\nexpected 2221 members, got', members, members === 2221 ? 'OK' : 'MISMATCH');
await conn.end();
