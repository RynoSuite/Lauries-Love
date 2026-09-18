# Laurie's Love

A support community for people living with cancer, and the people around them.
Web app, mobile app and admin console over a Supabase backend.

**Start with [`PROJECT-STATUS.md`](PROJECT-STATUS.md)** — it is the
authoritative state of the project. This file is orientation only.

## Where things are

| | |
|---|---|
| Web app | https://lauries-love.pages.dev (Cloudflare Pages, project `lauries-love`) |
| Backend | Supabase `hcvyknwbixnlwqozmkas`, in the client's organisation |
| Repo | `github.com/RynoSuite/Lauries-Love` |

> The Supabase project names are **backwards**: `lauries-love-staging` holds
> everything, and the one labelled `Lauries Love` is empty. Match on the project
> ref, not the name. See `PROJECT-STATUS.md` §1.

## Structure

```
web/                React 18 + Vite + Tailwind + React Query. Member app AND
                    admin console. Deployed to Cloudflare Pages.
app/                React Native / Expo mobile app (members only — staff
                    functions live on the web).
supabase/
  migrations/       53 SQL migrations. Applied by pasting into the SQL editor.
  functions/        6 edge functions (donations, email, push, moderation,
                    account deletion).
  seed/             Demo data for review. Seeded members are identifiable by
                    their @seed.laurieslove.invalid address.
scripts/            The legacy migration tooling — see below.
support-dashboard/  Standalone HTML staff dashboard. Points at the EMPTY
                    project; treat as suspect.
api/                The OLD NestJS/TypeORM/MySQL backend. Reference only — the
                    entity definitions document the legacy schema. Not running.
```

## Stack

- **Web:** React 18, Vite, Tailwind (every colour resolves through a CSS
  variable, which is what makes runtime theming and light mode possible),
  React Query, Leaflet
- **Mobile:** React Native 0.79 / Expo 53, React Navigation v7, MMKV
- **Backend:** Supabase — Postgres with row-level security, Auth, Storage,
  Edge Functions
- **Not used any more:** NestJS, MySQL, AWS Cognito, S3, Sendbird,
  Authorize.Net. All of those belong to the legacy platform being migrated away
  from.

## Running it

```sh
cd web && npm install && npm run dev        # http://localhost:5173
cd app && npm install && npx expo run:ios   # or run:android
```

Both need a `.env` (see `.env.example` in each). Secrets are gitignored.
`DEV-SETUP.md` has the detail, and `MOBILE-REVIEW-ACCESS.md` covers getting a
build onto a reviewer's phone.

Deploying the web app:

```sh
cd web && npm run build
npx wrangler pages deploy dist --project-name lauries-love --branch main
```

## The legacy migration

The old platform's data has been migrated into **staging** (16–18 Sept 2026):
2,219 members, 406 posts, 1,028 likes, 284 friendships. Production has not been
cut over.

`MIGRATION-RUNBOOK.md` is the full account, including what did **not** survive
and why. The tooling is in `scripts/`, every importer takes `--dry-run`, and
each is idempotent on a legacy key so a failed run can be repeated.

**The exports contain names, emails, dates of birth and cancer diagnoses for
2,221 real people.** Write them outside this repository, keep them local, and
delete them once the import is verified. `.gitignore` covers `*.ndjson` and
`*.sql` as a second line of defence, not as permission.

## Documentation

`PROJECT-STATUS.md` and `MIGRATION-RUNBOOK.md` are current and maintained.
The other markdown files are dated records — audits, handoffs, session logs and
meeting briefs — kept for their reasoning rather than their status. Several
describe the pre-Supabase architecture. Do not act on them without checking
against `PROJECT-STATUS.md` first.
