# Where this project stands

Working notes for the Laurie's Love takeover. Updated 8 Sept 2026.
Read this first when picking the work back up.

Companion docs: `MIGRATION-RUNBOOK.md` (how to reach the legacy data),
`DEV-SETUP.md` (running the mobile app), `PROJECT-STATE.md` (Aaron's original
history, partly stale).

---

## 1. Live now

| | |
|---|---|
| **Web app** | https://lauries-love.pages.dev |
| **Repo** | github.com/RynoSuite/Lauries-Love (`origin`) |
| Aaron's original | github.com/AaronPilk/Lauries-Love-App-Rebuild (`upstream`, fetch-only) |
| **Hosting** | Cloudflare Pages project `lauries-love`, on the j.marshall@skyway.media account |
| **Backend** | Supabase **staging** `hcvyknwbixnlwqozmkas` (production is `iwbfsbriippzmdyrsmsu`, untouched) |
| Test login | `jeremy@skyway.media` — password in `PARALLEL-AUDIT-2026-08-23.md`. **Rotate it**; it is committed in plaintext and the account is a support owner. |

Deploy after any change:

```
cd web
npm run build
npx wrangler pages deploy dist --project-name lauries-love --branch main
```

---

## 2. Blocked on the client

Nothing here can be finished without them. Chase as one list.

1. **OpenAI API key.** Two features at once: Spanish translation of member
   posts, and automatic content moderation (`moderate-content` is built and
   returns 503 until keyed). Under $5/month at current volumes. One account
   covers both, which is why OpenAI over DeepL despite DeepL's better Spanish.
2. **SMTP2GO account on the client's own domain.** Password-reset mail to ~2,200
   members must come from `@laurieslove.org` with SPF/DKIM. Sending from
   `skywaymediamail.com` will be treated as phishing by a meaningful share of
   them, and every unclicked reset is a member locked out. Skyway's key exists
   and is fine for testing only.
3. **Post-image privacy decision.** `post-images` is a public bucket, so any
   post photo is readable by URL — including photos in private groups. That was
   the original design and the mobile app assumes it. The alternative is a
   private bucket with signed URLs, as chat attachments already use: ~20 minutes
   of work, slightly slower feeds. Much cheaper to change now than after 2,200
   people have posted.
4. **Apple Developer account + App Store listing.** Needed for TestFlight. See §5.

### Emails to build once SMTP exists

- Password reset (Supabase Auth handles it; needs SMTP configured, not code)
- **Notify moderators when content is reported.** A badge only works if someone
  is already in the app; a report at 2am reaches nobody until morning. In a
  cancer community a report can be someone in crisis.
- Repoint `send-email` from SendGrid to SMTP2GO (it is hardcoded to SendGrid,
  and there is no SendGrid account)

---

## 3. Migrations that must be run on each environment

Applied to **staging** as of this writing. **None have been run on production.**
Files live in `supabase/migrations/`; paste into the Supabase SQL editor.

| File | What it enables |
|---|---|
| `20260908120000_branding_theme_v1` | Admin colour theming + logo upload (`theme` column, `branding` bucket) |
| `20260908140000_admin_dashboard_stats_v1` | Dashboard metrics function |
| `20260908160000_support_ticket_replies_v1` | Staff can reply to tickets |
| `20260908180000_comment_replies_v1` | Threaded comment replies |
| `20260908200000_edit_delete_v1` | Post/message/comment edit + delete, unread counts |
| `20260908220000_moderation_resolve_v1` | Moderation actually removes content; queue returns `post_id` |

> `20260908220000` was amended after it was first run: `moderation_queue_detailed()`
> now also returns `post_id` so the queue can deep-link to the reported post.
> The return type changed, so the file drops the function before recreating it.
> **Re-run that file anywhere it was already applied**, or the moderation page's
> "view post" link will not appear.

**Two gotchas learned the hard way:**

- Buckets created by raw SQL `insert into storage.buckets` do **not** always
  register. Create them in the dashboard UI instead. `branding` and
  `post-images` both needed this, and `post-images` also had to be flipped to
  public by hand.
- `is_staff()` exists in the migration files but was never applied to staging.
  Use `is_support_staff()`, which is there.

---

## 4. Web app: what has been built

Redesigned against the client-approved comp: magenta-led dark theme, three
column shell, real logo, Fraunces/Figtree.

- **Branding console** — every colour token editable with a real picker, logo
  upload, live preview, contrast warnings
- **Dashboard** — real metrics from Postgres, two trend charts, iOS/Android
  split, actionable queues first
- **Support** — staff can reply (lands in the member's Messages), infinite load
  with server-side search
- **Moderation** — shows the reported content, and Remove actually deletes
- **Feed** — post images, comments with one-level replies and likes,
  edit/delete with a styled confirm
- **Messages** — attachments (image/video/file), date separators, timestamps,
  edit/delete, unread badges
- **Map** — role/diagnosis/gender/age filters, centres on the member's location
- **Password reset** — `/forgot-password` and `/reset-password`, link or 6-digit
  code, matching the mobile flow
- **Onboarding** (`/welcome`) — role, diagnosis types and subtypes, diagnosis
  year, age range, gender, city/state/zip, geolocation. Web signup collected
  only name/email/password, so web-joined members were invisible on the map and
  unmatched to groups. New signups land here; existing incomplete profiles get a
  dismissible banner keyed on `role_id`. **Skippable on purpose** — the August
  lockout was a hard completeness gate that bounced members back forever.
- **Member profiles** — role, diagnosis, stage and diagnosis year, plus Message,
  Add friend and View-on-map, matching what the current app shows.
- **Notifications** — opening the page clears the bell. Marking one read now
  refreshes the badge instead of waiting for the 60s poll. Rows that were unread
  on arrival stay highlighted for that visit so clearing the count does not also
  erase what is new. Likes and comments deep-link to the post. **Messages are
  deliberately different**: a thread is read only when that thread is opened.
- **Stale-build reload** — an open tab fetches the JS bundle once, so a deploy
  was invisible until a hard reload; this was reported as a caching bug. Vite
  stamps a build id into the bundle and into `dist/version.json`
  (`web/src/lib/useBuildVersion.ts`); the app compares them on navigation and on
  window focus, reloads on the first navigation after a deploy, and otherwise
  shows a refresh pill. `web/public/_headers` keeps `index.html` and
  `version.json` uncached and `/assets/*` immutable for a year.
- **Post permalinks** (`/posts/:id`) — feed timestamps link here, and the
  moderation queue opens the reported post (or, for a reported comment, the post
  it hangs under) in a new tab.

### Known gaps / next up

- **Group messages** (client request, NEXT UP). A normal thread with several
  members, Facebook-style: truncated names in the list, full member list when
  opened. `conversations.is_group` and `conversation_members` already support
  it; the work is UI plus a create-group-thread flow.
- **Bilingual EN/ES** (client request, blocked on the OpenAI key for post
  translation, though the UI layer needs no key). Two separate jobs: static UI
  strings via i18next — mobile already has the scaffolding at
  `app/src/presentation/translations` but only 6 files use it — and on-demand
  translation of member posts. Also wanted: a preferred-language field at
  registration, which needs a column on `profiles`.
- **Groups have no visibility flag.** Every group is live the moment it is
  created; no draft or archive state.
- **Agents can read all member PII.** `profiles_private` (email, phone, zip,
  DOB) is readable by any support agent, not just owners. Flagged in the August
  audit and never resolved. Worth a deliberate decision.
- **Colour tokens never fully verified.** The theming mechanism is proven, but
  nobody has clicked through confirming all 24 tokens paint what their label
  claims.

---

## 5. Mobile app: not started

Aaron built it; nobody on this side has run it. `app/node_modules` is not even
installed.

**iPhone + board members both need TestFlight**, and TestFlight has two tiers
with very different timelines:

- **Internal** (100 testers): no Apple review, live within the hour, but each
  tester must be a user on the client's App Store Connect team.
- **External** (10,000): just an email invite, but requires Beta App Review,
  24–48h, and can be rejected.

For a short deadline, do both at once: internal for immediate review, external
submitted in parallel.

Three unknowns to settle first:

1. **Which bundle ID.** `app.json` says `com.SMv587dd8da82c.app` — the agency's
   original. If the client's Apple account holds the live app, that is the one
   to keep; it preserves the update path to existing users.
2. **Current live version**, so a TestFlight build number exceeds it.
3. **Your App Store Connect role** — Admin or App Manager, not Developer, or you
   cannot manage TestFlight.

Android needs the Expo `lauries-love` org invite from Aaron, for the signing
keystore. A new keystore cannot update an existing Play listing.

---

## 6. Decisions already made, so they are not relitigated

- **Magenta leads the interface**, over the brand guide's "one vivid stroke"
  note, because the client approved the comp. Magenta has two stops: `#911766`
  is a FILL (white on it is 8.34:1); as type on the dark card it scores 1.82:1,
  so `#F45FAF` is the on-dark stop at 5.14:1.
- **Tailwind resolves every colour through a CSS variable**, which is what makes
  runtime theming possible. Editing `tailwind.config.js` needs a dev server
  restart — it does not hot-reload, and this cost real time twice.
- **Comment replies are one level deep**, enforced by a database trigger.
- **Edits are marked, never silent** (`edited_at`), because quietly rewriting a
  message after someone replied is a trust problem in a health community.
- **Staff cannot edit or delete member messages**, only their own.
- **Sendbird message import is not worth building.** 494 posts are recoverable
  and worth migrating; direct messages amount to ~80 in total.
