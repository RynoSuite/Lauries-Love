#!/usr/bin/env node
// Publish an over-the-air update that is bundled with EXACTLY the variables
// the builds use.
//
//   node scripts/ota-update.mjs testflight "What changed"
//
// Why this exists instead of a bare `eas update`:
//
// EXPO_PUBLIC_* values are INLINED into the JavaScript at bundle time, and
// `eas update` bundles on the machine it runs on. It does not read the `env`
// block in eas.json the way `eas build` does. By default it reads the local
// .env, which on 22 Sept pointed Sentry at the OLD org nobody can read and
// carried a PostHog key the builds do not have. The first update published
// that way would have silently re-routed crash reports into the void and
// switched analytics on — a bundle that disagrees with the build it patches.
//
// `--environment` is no better: it loads EAS's server-side variables, which
// are also out of step (the builds moved to eas.json on 21 Sept).
//
// So this reads build["staging-env"].env from eas.json — the one source of
// truth the builds use — sets EXPO_NO_DOTENV=1 so a stray .env cannot leak in,
// and runs the update with nothing else.

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const [channel, ...messageParts] = process.argv.slice(2);
const message = messageParts.join(' ').trim();

if (!channel || !message) {
  console.error('usage: node scripts/ota-update.mjs <channel> "<message>"');
  console.error('  channel: testflight (the board) or diagnose (ad-hoc builds)');
  process.exit(1);
}

const eas = JSON.parse(readFileSync(join(appDir, 'eas.json'), 'utf8'));
const buildEnv = eas.build?.['staging-env']?.env;
if (!buildEnv) {
  console.error('eas.json has no build["staging-env"].env — refusing to guess.');
  process.exit(1);
}

// Only what the builds carry, plus the switch that stops .env being read.
// Anything EXPO_PUBLIC_* already in this shell is dropped first, so a value
// exported in the terminal cannot override the build's either.
const env = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => !k.startsWith('EXPO_PUBLIC_')),
);
Object.assign(env, buildEnv, { EXPO_NO_DOTENV: '1' });

console.log(`Publishing to channel "${channel}" with the build's variables:`);
for (const k of Object.keys(buildEnv).filter((k) => k.startsWith('EXPO_PUBLIC_'))) {
  console.log(`  ${k}`);
}
console.log('');

// shell:true is required on Windows, where npx is a .cmd shim that Node will
// not spawn without a shell. But with a shell Node joins arguments with bare
// spaces, so every value is quoted here — otherwise a message containing a
// space arrives as several arguments.
const q = (s) => `"${String(s).replace(/"/g, '\\"')}"`;
const command = [
  'npx', 'eas-cli@latest', 'update',
  '--channel', q(channel),
  '--message', q(message),
  '--non-interactive',
].join(' ');

const res = spawnSync(command, { cwd: appDir, env, stdio: 'inherit', shell: true });
process.exit(res.status ?? 1);
