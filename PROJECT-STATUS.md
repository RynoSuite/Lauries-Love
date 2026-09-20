# Where this project stands

Working notes for the Laurie's Love takeover. **Updated 18 Sept 2026.**
Read this first when picking the work back up.

## The headline, 18 Sept

**The legacy community is in staging.** 2,219 members, 406 posts, 1,028 likes,
884 comments, 284 friendships and 39 post images — the real thing, not seed
data. Everything that can move without AWS credentials has moved.

Also done since 9 Sept: the Supabase project now belongs to **the client's
organisation**; the web app has **light mode** and a **daily rotating quote**
in the left rail; and the **age/gender vocabulary split** between web and
mobile is fixed (§1a).

Still open, in the order that matters:

1. **222 profile avatars** — blocked on AWS access (private bucket)
2. **SMTP2GO** — blocked on the client, and nothing can reach 2,200 members
   without it
3. **Production cutover** — `iwbfsbriippzmdyrsmsu` has had NO migrations run
4. **Stripe** — donations are a placeholder that says so honestly
5. **Mobile light mode** — deliberately deferred; it is a refactor, not a
   token swap

Companion docs: `MIGRATION-RUNBOOK.md` (**the legacy migration, now with what
actually ran — read this second**), `SESSION-2026-09-09.md` (the 9 Sept
session), `DEV-SETUP.md` (running the mobile app), `PROJECT-STATE.md` (Aaron's
original history, partly stale).

---

## 1. Live now

| | |
|---|---|
| **Web app** | https://lauries-love.pages.dev |
| **Repo** | github.com/RynoSuite/Lauries-Love (`origin`) |
| Aaron's original | github.com/AaronPilk/Lauries-Love-App-Rebuild (`upstream`, fetch-only) |
| **Hosting** | Cloudflare Pages project `lauries-love`, on the j.marshall@skyway.media account |
| **Backend** | Supabase **staging** `hcvyknwbixnlwqozmkas` (production is `iwbfsbriippzmdyrsmsu`, untouched) |
| **Ownership** | Supabase, SMTP2GO and the AWS accounts are all **the client's** — which is the right answer for a database of members' health data. `lauries-love-staging` was **transferred to the client's Supabase organisation, 17 Sept.** The ref, URL and keys are unchanged, so no code moved. The `FCM_SERVICE_ACCOUNT` secret survived; there were no others to lose. |
| Test login | `jeremy@skyway.media` — password in `PARALLEL-AUDIT-2026-08-23.md`. **Rotate it**; it is committed in plaintext and the account is a support owner. |

> **The project names are backwards — do not trust them.**
> `lauries-love-staging` (`hcvyknwbixnlwqozmkas`) is where **everything** is:
> all 53 migrations, the buckets, the demo data and now the real community.
> `Lauries Love` (`iwbfsbriippzmdyrsmsu`) is labelled production and is
> **empty** — zero migrations have ever been run on it. Match on the ref, which
> cannot be edited, not the name, which can.

### Credentials due for rotation

The migration needed four secrets, all of which passed through a session
transcript. None is in this repo, and none should be treated as still private:

| Secret | Where | Why it matters |
|---|---|---|
| Legacy RDS master password | Secrets Manager → `laurieslove-rds-secret` | Full read/write on 2,221 people's records, from anywhere (§2, 0b) |
| Sendbird master API token | Sendbird → Settings → Application → API tokens | Can read **every message in the app** |
| Supabase staging service role key | Settings → API Keys | Bypasses all RLS on staging, which now holds real member data |
| `jeremy@skyway.media` password | `PARALLEL-AUDIT-2026-08-23.md` | Committed in plaintext; support-owner account |

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

1. ~~**Web and mobile write different values for the same profile fields.**~~
   **FIXED 16 Sept** — and it was worse than recorded here: **mobile disagreed
   with itself.** Three files held three vocabularies. `constants/onboarding.ts`
   wrote `60-plus` at signup; `constants/map.ts` offered only female and male
   as filters; and `ProfileTab.constants.ts` — the profile editor — wrote
   **`55-59` under a label reading "45-59"**, plus `60+` and `any`. Editing your
   profile changed your stored value without changing your answer.

   The legacy export carries the damage: **26 members hold `60+` and 6 hold
   `55-59`**, a bracket no filter in either app has ever listed. Those six
   tapped the row labelled 45-59 and were unfindable ever since.

   The canon is mobile's, and not by preference: web's buckets **cannot
   represent** `45-59`, which is 930 real members. Importing them through web's
   set would have destroyed the answer rather than converted it.

   ```
   age_range   18-34 | 35-44 | 45-59 | 60-plus
   gender      female | male | non-binary | prefer-not-to-say
   ```

   `non-binary` was added to mobile rather than dropped from web. Data patched
   by `supabase/migrations/20260916120000_align_filter_vocabulary_v1.sql`, which
   deliberately leaves `30-39` and `40-49` alone — they straddle two canonical
   buckets with five years either side, and a wrong age looks like an answer.
2. **A full web/mobile parity audit — still not done, and now more urgent, not
   less.** The age and gender divergence was found by accident and turned out to
   be three bugs rather than one, which says nothing good about the fields
   nobody has checked: role ids, diagnosis types and subtypes, diagnosis year,
   city/state, group visibility, notification types, password rules. Two apps
   writing the same table is only safe if they agree on every field.

   **2,219 real members are now in staging**, so this is no longer "before the
   import" — but production is still empty, so it is still before the one that
   counts.
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
4. **SMTP2GO — DNS done 18 Sept, waiting on credentials.**

   > **Decision reversed.** This previously read "SMTP2GO on Skyway's own
   > details, not the client's domain". It is **the client's domain and the
   > client's SMTP2GO account** — which is the better answer anyway: 2,200
   > people receiving a password reset are far likelier to trust
   > `laurieslove.org` than `skyway.media`, and the `send-email` function was
   > already coded to send from `no-reply@laurieslove.org`.

   Three CNAMEs are live in Route 53 (`laurieslove.org`, zone
   `Z07397542W1982COOGOQ0`) and verified: `em909124` → `return.smtp2go.net`,
   `s909124._domainkey` → `dkim.smtp2go.net`, `link` → `track.smtp2go.net`.
   The DKIM chain returns a real RSA key, and the domain's existing DMARC uses
   relaxed alignment (`adkim=r`), so subdomain DKIM satisfies it.

   **SPF and DMARC were deliberately left alone.** The domain has *no* SPF
   record at all (only a Google site-verification TXT), and MX points at Google
   Workspace — so adding SPF touches live business mail and wants its own
   decision. `v=spf1 include:_spf.google.com include:spf.smtp2go.com ~all` is
   the likely answer. **Leave DMARC at `p=none` until after the reset
   campaign**: tightening it first risks silently binning the one email 2,200
   people need to get back into the app.

   Still needed, all from the client's SMTP2GO account:
   a dedicated **SMTP user** (for Supabase Auth), an **API key** (for the
   `send-email` function, which POSTs to an HTTP API rather than speaking SMTP),
   and the plan's **hourly/monthly send limits**.

   Two things that bite even with perfect credentials: **Supabase Auth has its
   own email rate limit**, separate from SMTP2GO's and low by default; and
   **Site URL / Redirect URLs must include the web app**, or every reset link is
   rejected as an untrusted redirect.

   **Nothing calls `send-email`.** No caller in the web app, the mobile app or
   the migrations. Repointing it off SendGrid is necessary but not sufficient —
   moderator alerts still need something to invoke it when content is reported.
5. **Two accounts did not get their legacy profile data.**
   `j.marshall@skyway.media` and `jeremy@skyway.media` already existed in
   Supabase, so the importer reported "email already registered" and skipped
   them — correctly, it never overwrites. But their legacy city, age, diagnosis
   and so on are still sitting in `members.ndjson` unmerged. Affects two people,
   and will look like a bug in three weeks. The other eight skyway.media
   addresses imported cleanly.
6. **Decide what happens to the empty production project.** `Lauries Love`
   (`iwbfsbriippzmdyrsmsu`) is still in Aaron's organisation, has never had a
   migration run on it, and several docs point at it as though it were live.
   Either transfer it too or retire it — otherwise it stays a trap.

## 2. Blocked on the client

Nothing here can be finished without them. Chase as one list.

0. **AWS read access for the 222 profile avatars.** The only thing still
   blocking the migration. They are stored as bare S3 keys
   (`users/<cognito>/profilePhotos/<uuid>.jpg`) and neither candidate bucket is
   public — `lauries-api-production` and `039868711312-general-files` both
   return 403. Needs a temporary public-read grant or a read-only IAM key
   scoped to those buckets. Post images worked only because
   `laurieslove-post-prod` happens to be public.

0b. **Security finding to pass on, separate from the migration.** The legacy
   production database accepts connections from **anywhere on the internet** —
   `sg-0272f79ebba1da009`, port 3306, source `0.0.0.0/0` — with a password as
   the only control, holding 2,221 people's names, emails, dates of birth and
   cancer diagnoses. Worth asking AWS for the connection logs. **Do not simply
   delete the rule:** it is the only inbound rule on the group, so the legacy
   app servers depend on it, and removing it would take the live app down. See
   `MIGRATION-RUNBOOK.md` §3.

1. ~~**OpenAI API key.**~~ **Dropped by the client, 10 Sept 2026** — no AI
   translation and no bilingual support for now. Two consequences worth
   remembering rather than rediscovering: `moderate-content` stays unkeyed and
   returns 503, so **automatic moderation does not exist** and the only thing
   flagging content is the keyword heuristic in
   `heuristic_moderation_flag()` plus member reports; and the i18next
   scaffolding at `app/src/presentation/translations` is now dead weight
   unless the decision reverses.
2. **SMTP2GO — DNS done, credentials outstanding.** The account is the
   CLIENT'S, and mail sends as laurieslove.org. Detail in §1a item 4.
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
| `20260911120000_group_delete_cascades_posts_v1` | Deleting a group deletes its posts, instead of republishing them to everyone |
| `20260916120000_align_filter_vocabulary_v1` | **One age/gender vocabulary across both apps** (§1a). Run it BEFORE any import — afterwards it is a mass update across real profiles. |
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

### Staging now holds REAL member data

As of 18 Sept, `hcvyknwbixnlwqozmkas` contains **2,219 real members with their
real diagnoses**, alongside ~2,310 demo profiles. Two consequences:

- **It is no longer a scratch environment.** Treat destructive SQL there the way
  you would treat production.
- **Demo and real data are mixed.** Seeded members are identifiable by their
  `@seed.laurieslove.invalid` email — a reserved TLD that can never receive
  mail — and `supabase/seed/demo_members_remove.sql` clears the whole set in one
  statement. **But it cascades:** the demo account's wall, friends, messages and
  groups all hang off seeded members, so running it empties
  `jeremy@skyway.media`'s tabs too. Do it after any review, not before.
- **The demographics look nothing like the community.** The demo set is evenly
  spread across four genders (811 non-binary, 474 female); the real community is
  85% female. Anyone reviewing the map is reading fabricated numbers.

---

## 4. Web app: what has been built

Redesigned against the client-approved comp: magenta-led dark theme, three
column shell, real logo, Fraunces/Figtree.

- **Light mode** (16 Sept) — toggle in the account menu, dark stays the
  default. Mostly a second set of `--c-*` values, but with three traps worth
  knowing before touching it:
  1. **Light must beat the org's saved theme** for surfaces, text and status.
     `applyTheme` writes the branding console's colours as INLINE styles, which
     win over any stylesheet rule, so a CSS-only light mode would be
     overwritten the moment branding loaded.
  2. **`magenta-text` is recomputed, not reused.** `#F45FAF` exists because
     `#911766` scores 1.82:1 on the dark card; on white that inverts exactly.
     The light stop is derived by darkening the org's own fill until it clears
     4.5:1.
  3. **The light values are duplicated on purpose** — `LIGHT_TOKENS` in
     `web/src/lib/theme.ts` and the `:root[data-theme='light']` block in
     `index.css`. The CSS copy paints the first frame (set by an inline script
     in `index.html` before React mounts); the TS copy is written inline after.
     **Change one without the other and you get a flash of the wrong colour.**

  The branding console still edits the DARK theme only. Its contrast warnings
  compare against the dark card, which is correct, but an org cannot tune what
  light mode does with their palette beyond the brand colour.
- **Daily quote** in the left rail (16 Sept) — replaced the fixed "Connect.
  Empower. Inspire." card with 50 client-supplied quotes, one a day. Derived
  from the date rather than stored: no table, no fetch, no cron, everyone sees
  the same quote on the same day, and a reload never shuffles it. Rolls over at
  the viewer's own local midnight, and a tab left open overnight re-arms a
  timer. `web/src/data/quotes.ts`.

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
  state, and none is wanted. Create, edit and delete all live in the admin
  console (`web/src/pages/admin/Groups.tsx`, owner-only) and nowhere else —
  mobile deliberately has no create button.
- **Deleting a group deletes its posts** (decided and built, 11 Sept).
  `posts.group_id` is `on delete cascade` now, so the rule holds whatever
  does the deleting rather than only the admin console. The console states the
  post count in the confirmation before it happens. Comments, reactions and
  pending moderation reports are cleared by the existing per-post triggers,
  which fire on cascaded deletes exactly as on direct ones. Migration:
  `20260911120000_group_delete_cascades_posts_v1`.
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
- **Home-screen name, 20 Sept.** `CFBundleDisplayName` is **`LL Beta`**, in both
  `app.json` and `ios/LauriesLove/Info.plist`. **Revert it to `Laurie's Love` at
  cutover, alongside the bundle identifier above.** The live app is still
  shipping — 2.1.5 went out 21 Aug — so board members are likely to have it
  installed already; two icons both reading "Laurie's Love" and nobody can tell
  the review build from the real one. Do not restore this note as an XML comment
  in the plist: Expo's config plugin rewrites that file on every build and eats
  comments.
- **Apple distribution certificates are at Apple's ceiling.** The team holds
  **three** `IOS_DISTRIBUTION` certificates, which is the maximum. Whenever EAS
  asks "reuse this distribution certificate?", **always reuse**. Creating a
  fourth forces a revoke, and revoking `561C51409BE567EC084939A91ED46F95`
  (expires 2027-08-21) would break OneSeven Tech's ability to ship updates to
  the live app — it signs the only ACTIVE `com.SMv587dd8da82c.app` App Store
  profile. The staging profile uses `7A311EB555BFBF6C6410121A3C85EA9` instead.
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

## 5c. Mobile light mode is deferred, not dropped

The client asked for light mode on **both** apps, 16 Sept. Web shipped the same
day; mobile was scoped out by agreement, because the two are nowhere near each
other in cost.

Web was cheap because every colour already resolves through a `--c-*` CSS
variable. Mobile has **no live theme provider at all** —
`app/src/presentation/theme/index.tsx` has NativeBase commented out — and
colours come from a static `app/src/styles/colors.ts` imported by **~217
files**, consumed inside `StyleSheet.create` **at module load**, plus ~130
hardcoded hex values in components. Static styles cannot respond to a theme
change, so this is a context/hook conversion across the whole app.

**Do not price it as "the same thing we did on web."** It is a refactor with a
regression surface covering every screen, and it wants its own estimate.

Related: the mobile app currently has **183 TypeScript errors** — 102 in
generated icon components, 81 elsewhere (e.g. a missing `eminence` colour
token). None were introduced by the vocabulary fix, and none are blocking, but
a theme refactor across 217 files would be much safer on a clean typecheck.

## 5b. Staff and admin functions live on the web, not in the app

Decided 11 Sept for group creation, extended 14 Sept to support. The mobile
app is for members. Anything that acts on other people's data belongs in the
admin console, where access is already gated and the screen is big enough to
do the job properly.

Removed from mobile on 14 Sept: the **Support inbox**, the **ticket detail**
and the **support staff management** screens. All three were staff-gated on
`getIsSupportStaff()`, all three duplicated `web/src/pages/admin/
SupportInbox.tsx`, and the inbox listed every reporter's **email and phone
number** — `profiles_private` data, on a phone, behind nothing but a role
check.

**"Contact support" in the Messages tab stays.** That is the member-facing
route: it creates a ticket and the reply arrives in the member's own messages.
It is not an admin screen and must not be removed with them.

## 5a. Native config is not real until something builds it

Learned the hard way on 13 Sept. `newArchEnabled` was changed from true to
false on 8 Sept and nobody noticed for five days, because every change since
was JavaScript and Metro reloads it onto whatever binary is already on the
phone. The first thing to actually compile that flag was a release build for a
client review, which failed: **react-native-mmkv 3.x is
New-Architecture-only** — its module extends a codegen class that is not
generated when the old architecture is selected, so it cannot compile at all.

Two rules follow:

1. **Anything touching `android/`, `ios/`, `app.json` or a native
   dependency needs a build before it counts as done.** The splash screen sat
   unverified the same way, for the same reason.
2. **The build profile matters.** The only Android build that had ever
   succeeded was `development`, which is a debug build that loads its
   JavaScript from Metro. `staging` — the standalone one an external
   reviewer needs — had never been run. A profile nobody has built is a
   profile that does not work yet.

## 7. Decisions already made, so they are not relitigated

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
- **Sendbird message import is not worth building.** ~~494 posts are
  recoverable~~ — **corrected 18 Sept: 316 are.** 160 posts have no recoverable
  body (`firstMessage` was not cached before ~mid-March 2025 and retention
  deleted the originals), and 740 of 783 comments are gone the same way. Direct
  messages were estimated at ~80; sampling eight conversations found **one
  message in total**, so skipping them is not a trade-off but an absence. Full
  accounting in `MIGRATION-RUNBOOK.md` §5.
- **Pending friend requests stay pending on import.** 218 of 284 were never
  answered. Accepting them would fabricate relationships between real people
  who never agreed to them.
- **Deleted accounts stay deleted.** 13 people appear in Sendbird but not in the
  member table. Their content — 17 posts, 80 likes, 8 friendships, 1 image — is
  dropped rather than hosted under resurrected profiles.
- **The ZIP beats the geocoder.** The legacy coordinates put 356 members in the
  wrong state and 144 at `0,0`, because the old platform geocoded city names
  with no state. State is derived from the ZIP; coordinates that disagree are
  discarded, so those members have no map pin rather than a wrong one.
- **Legacy `role_id` is not imported.** It reads 125 Admin and 85 Super Admin
  out of 2,221. Everyone lands as Basic; granting admin is a deliberate act.
- **Light mode beats a saved brand theme for surfaces and text.** The branding
  console's colours were all picked against the dark ground, so honouring a
  saved `#0A2A2D` "card" in light mode would paint black cards on a white page.
  The brand fill and gold still come from the org.
