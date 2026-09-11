# Where this project stands

Working notes for the Laurie's Love takeover. Updated 9 Sept 2026.
Read this first when picking the work back up.

Companion docs: `SESSION-2026-09-09.md` (**everything done on 9 Sept and what
comes next, in order — read this second**), `MIGRATION-RUNBOOK.md` (how to
reach the legacy data), `DEV-SETUP.md` (running the mobile app),
`PROJECT-STATE.md` (Aaron's original history, partly stale).

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

## 1a. Do first, right after the review call

The detail behind each of these, and the full log of what changed on 9 Sept,
is in `SESSION-2026-09-09.md`.

1. **Web and mobile write different values for the same profile fields.** Age
   ranges: web writes `18-29/30-39/40-49/50-59/60-69/70+`, mobile writes and
   filters on `18-34/35-44/45-59/60-plus`. Gender: web writes `Female/Male/
   Non-binary/Prefer not to say`, mobile `female/male`. A member who completes
   their profile on one is invisible to the other's filters — silently, with no
   error. Pick one set (mobile's is the likelier canon: it is what the 2,200
   legacy members already use), change `web/src/components/ProfileFields.tsx`,
   and migrate existing rows. `supabase/seed/demo_align_filter_values.sql`
   patched the demo members only.
2. **A full web/mobile parity audit, before the data import.** The age and
   gender divergence was found by accident, which means nobody has checked the
   rest: role ids, diagnosis types and subtypes, diagnosis year, city/state,
   group visibility, notification types, password rules. Two apps writing the
   same table is only safe if they agree on every field, and the time to find
   out is before 2,200 real members are in it, not after.
3. ~~**A real Groups page on mobile**~~ — **built 11 Sept.** The groups
   screen now mirrors web: covers as card backgrounds behind a scrim, My
   groups then Groups you can join, and a group page with that group's feed,
   join and leave-behind-a-confirm. Still missing against web: the member list
   on the group page, and there is still no group visibility flag on either
   side (every group is live the moment it is created).
   ~~Old note:~~ Web has a Groups
   directory (My groups / Groups you can join) and a group page with that
   group's posts, join, leave and members. Mobile has only the browse-and-join
   list in Messages, and the community wall's Groups tab is a post filter
   (`visibility === 'group'`), not a directory. The wall's "Explore groups"
   button points at the join list as a stopgap and should point at the real
   page once it exists.
4. **SMTP2GO on Skyway's own details** (decided: our company info, not the
   client's domain). Needed for password reset and moderator alerts. Repoint
   `send-email`, which is hardcoded to SendGrid and has no account behind it.

## 2. Blocked on the client

Nothing here can be finished without them. Chase as one list.

1. ~~**OpenAI API key.**~~ **Dropped by the client, 10 Sept 2026** — no AI
   translation and no bilingual support for now. Two consequences worth
   remembering rather than rediscovering: `moderate-content` stays unkeyed and
   returns 503, so **automatic moderation does not exist** and the only thing
   flagging content is the keyword heuristic in
   `heuristic_moderation_flag()` plus member reports; and the i18next
   scaffolding at `app/src/presentation/translations` is now dead weight
   unless the decision reverses.
2. **SMTP2GO — still waiting.** Decided 9 Sept: **Skyway's own details**, not
   the client's domain. Password-reset mail to ~2,200 members. Skyway's key exists
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
| `20260908240000_group_messages_v1` | Ad-hoc group threads: create/add/leave/rename + group-aware notifications |
| `20260908260000_location_precision_v1` | **Privacy.** Rounds every stored location to ~0.7mi + backfills existing rows |
| `20260908280000_location_precision_v2` | **Privacy.** Coarsens further to a ~3.5mi grid; map no longer re-rounds |
| `20260908300000_group_min_two_v1` | Lowered group minimum to two ~~(superseded same day)~~ |
| `20260908320000_group_min_three_v1` | Restores the three-person minimum. **Run this; skip 300000** |
| `20260909120000_post_delete_trigger_fix_v1` | Deleting any post failed on a BEFORE-trigger conflict; splits the reaction cleanup |
| `20260909140000_leave_any_conversation_v1` | Swipe-to-delete a conversation: removes it for the caller only |
| `20260909180000_unread_by_conversation_v1` | Per-thread unread counts, so the Messages list can show which thread is waiting |
| `20260909160000_moderation_orphan_cleanup_v1` | **Bug.** Reports for deleted content stayed pending forever and inflated the dashboard count; closes them on delete + backfills |

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

- **Group messages** — done. Ad-hoc threads with several members. Composer has
  One person / Group tabs; the group tab picks from accepted connections only.
  List rows show stacked avatars and truncate the roster ("Sarah, Mike +3");
  the open thread has a header with the member list, add, rename and leave;
  incoming messages are attributed when the sender changes.

  Decisions worth knowing: **members must be accepted connections** of whoever
  adds them, so nobody is pulled into a thread by a stranger. **Any member can
  add**, not just the creator, or a thread freezes when its creator goes quiet.
  **Nobody can be removed by anyone else** — in a support community that is a
  harm vector with no moderator inside a private thread to appeal to; you can
  only leave yourself. **Minimum two others.** Briefly lowered to one on 2026-09-08 and reversed the
  same day: with one other person a group duplicates the direct message, and
  because group threads have no `direct_key` uniqueness, several could pile up
  alongside it, all accepting messages, a reply landing in whichever was open.
  Ceiling of 50. Leaving keeps your messages in place rather than rewriting the thread for
  everyone still in it.

  Membership is written only by SECURITY DEFINER RPCs
  (`create_group_conversation`, `add_conversation_member`,
  `leave_conversation`, `rename_conversation`, `my_connections`) because
  `conv_members_insert` is deliberately self-insert only.
- ~~**Bilingual EN/ES**~~ — **dropped by the client, 10 Sept 2026**. The
  i18next scaffolding at `app/src/presentation/translations` (6 files) stays
  in place but is not being extended. If this comes back it is two jobs, not
  one: static UI strings, which need no key, and on-demand translation of
  member posts, which does.
- **Groups are live on creation, by decision (11 Sept).** No draft or archive
  state, and none is wanted. The only lifecycle a group has is **create and
  delete, both admin-only** — deletion is not built yet on either platform.
  Worth thinking about before it is: a group's posts carry `group_id` with
  `on delete set null`, so deleting a group today would leave its posts
  behind as ordinary public posts rather than removing them. That is almost
  certainly not what an admin deleting a private support group expects.
- **Column-level lock on coordinates is still pending.** Locations are now
  rounded on write, so the exact value no longer exists anywhere. The remaining
  hardening is `revoke select (latitude, longitude) on public.profiles from
  authenticated` so coordinates can only be read via the SECURITY DEFINER
  `users_in_bbox`. Blocked on mobile: `app/src/services/supabase/supabase.api.ts`
  reads profiles with `select('*')`, and a revoked column makes a wildcard
  select fail outright. Sequence: name the columns explicitly in that query,
  ship the build, then revoke.
- **Agents can read all member PII.** `profiles_private` (email, phone, zip,
  DOB) is readable by any support agent, not just owners. Flagged in the August
  audit and never resolved. Worth a deliberate decision.
- **Colour tokens never fully verified.** The theming mechanism is proven, but
  nobody has clicked through confirming all 24 tokens paint what their label
  claims.

---

## 5. Mobile app: builds now running

Dependencies installed (yarn classic; `yarn` is not on PATH, use
`npx yarn@1.22.22`). Getting a build onto a phone turned up four things worth
keeping:

- **EAS project repointed.** `app.json` pointed at `owner: lauries-love`, an
  Expo account we have no access to. Now `rynosuite`, project
  `3dce34f7-098c-4c93-84c8-5c2542b31d2b`. **Handoff item:** it should end up in a
  client-owned Expo organisation, not a personal account. Expo supports
  transferring a project, and Expo permissions are per-account, so anyone
  invited to reach this project can see every other project in that account.
- **Bundle identifier.** The native project said `com.aaronpilk.laurieslove`,
  registered to Aaron's personal Apple team, so the client's team could not
  claim it. Now `org.laurieslove.staging` with `DEVELOPMENT_TEAM = 49HFHLWS47`
  (Love Laurie's, Inc). **At cutover** both `app.json` and
  `ios/*.xcodeproj/project.pbxproj` must change to the live app's
  `com.SMv587dd8da82c.app`. Note the native value wins over `app.json` whenever
  an `ios/` directory exists.
- **CRLF broke the build.** `ios/.xcode.env` is sourced by `sh` on the macOS
  builder, where a carriage return is not whitespace, so a blank line became a
  command named : "line 5: : command not found". `Podfile` and
  `android/gradlew` were damaged the same way. Fixed, and `.gitattributes` now
  pins LF for anything a shell runs. Do not remove it.
- **Free Expo plan.** `resourceClass: large` needs a paid plan; removed from the
  staging profile only.

## 6. Mobile app: what Aaron built (not yet reviewed)

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
