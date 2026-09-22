# TestFlight for the board — 20/21 Sept 2026

**The mobile app is on TestFlight and it works.** This is the record of getting
it there, because almost nothing about it was obvious and five of the blockers
pre-dated the session.

Read `PROJECT-STATUS.md` first for the project as a whole. This file covers the
iOS delivery pipeline and what remains before board members can install it.

---

## 1. State — updated 22 Sept

| | |
|---|---|
| **Board build** | **161**, in TestFlight, **with over-the-air updates compiled in** (§8) |
| **Beta App Review** | **161 submitted 21 Sept 23:01 PT — `WAITING_FOR_REVIEW`**. Board members cannot install until Apple approves |
| **External group** | **`Board Review`**, id `380101d7-8a6b-4fea-bf71-e3dce7a16aa4`, build 161 attached, **no testers yet, no public link** |
| **Earlier build** | 160 — works, but has no OTA; superseded by 161 |
| **App Store Connect app** | `Lauries Love Beta`, Apple ID **6814278840**, bundle `org.laurieslove.staging` |
| **Expo project** | **`@lauries-love/lauries-love-beta`**, id `101ddcd9-0197-48d7-800b-84b3bcc67bb2` — the CLIENT's account, on their paid plan |
| **Branch** | `testflight-board-review`, **pushed to origin**, not merged to main |
| **Home-screen name** | **`LL Beta`** — so it does not collide with the live app |
| **Backend** | staging (`hcvyknwbixnlwqozmkas`) — the migrated community, not production |
| **Crash reporting** | Sentry `skyway-media/react-native`, working, readable |
| **Android** | prepared for Play internal testing; **blocked only on a Google Maps API key** (§9) |

### The live app was never touched

`com.SMv587dd8da82c.app` (Apple ID 1624981989) is **live and actively
maintained by OneSeven Tech** — v2.1.5 shipped 21 Aug 2026, and its Expo
project shows builds on 21 and 24 Aug. It has an external tester group with a
**public link enabled**, so a staging build pushed there would have reached
real clients. Everything here was deliberately built as a **separate** app
record and a **separate** Expo project for that reason.

---

## 2. Getting a build onto a phone

Two routes. Both need the App Store Connect API key (§5).

### TestFlight — what the board will use

```
cd app
npx eas-cli build --platform ios --profile testflight --non-interactive --no-wait
npx eas-cli submit --platform ios --profile testflight --latest --non-interactive
```

~10 min build, ~3 min Apple processing. `submit` needs the ASC API key in
`eas.json` (see §5 — add it, submit, then `git checkout app/eas.json`).

### Ad-hoc — much faster, no Apple involved

```
npx eas-cli build --platform ios --profile diagnose --non-interactive --no-wait
```

Installs from the build page URL opened in Safari **on the device**. No
submission, no processing, no review — about 12 minutes end to end instead of
20. Jeremy's iPhone is already registered (`iOS Device (added by Expo)`,
8 Sept). **Delete the TestFlight copy first**; iOS will not install an ad-hoc
build over an App Store–signed one.

The `diagnose` profile pins **Xcode 16.4** deliberately, to keep a way of
testing without the toolchain Apple forces on uploads. Use `testflight` for
anything that has to reach Apple.

### Android, as a debugger

```
npx eas-cli build --platform android --profile staging --non-interactive --no-wait
```

Then install the APK on the emulator (`Pixel_10_Pro` exists, Play Store image,
API 37) and read `logcat`. **A release Android build prints the fatal
JavaScript error; iOS only aborts.** This is what found the crash below after
hours of reading hex offsets, and it is the first thing to reach for when
shared-code behaviour differs between platforms.

---

## 3. What was actually wrong

Five blockers, **all pre-existing**. None was introduced by the light mode or
swipe deck work, and every one of them would have stopped any App Store upload
from this repo.

### 3a. The crash: iOS and Android were on different architectures

The one that cost the night. Sentry, once readable, said it in one line:

```
Failed to create a new MMKV instance: react-native-mmkv 3.x.x
requires TurboModules, but the new architecture is not enabled!
```

`app.json` said `newArchEnabled: true`. `android/gradle.properties` said
`newArchEnabled=true`. **`ios/Podfile.properties.json` said `"false"`.**

So iOS built on the old architecture, `react-native-mmkv` 3.x could not
register its `MmkvCxx` TurboModule, and the import threw during module
evaluation — fatal in Release, a dismissable redbox in a dev client.

**Why nobody had seen it:** every previous iOS build was a **dev client loading
JavaScript from Metro**. The first Release build ever made died instantly. It
also means iOS storage (`useStorage`, via `local-storage-adapter.ts`, which
creates an MMKV instance at module scope) had **never worked**.

Light mode did not cause it. It *exposed* it, by importing MMKV into
`colors.ts`, which 217 files import, moving a dormant failure to startup.

Fixed by setting `newArchEnabled` to `"true"` in `ios/Podfile.properties.json`,
plus `colors.ts` now `require()`s MMKV lazily inside its try/catch — a static
import throws before any guard in that file can run. **Do not "tidy" that back
into a static import.**

### 3b. ITMS-90725 — the iOS 26 SDK is mandatory

Apple rejects any upload not built with the iOS 26 SDK. EAS defaulted to Xcode
16.4 for Expo SDK 53. The `testflight` profile now pins
`macos-sequoia-15.6-xcode-26.0`. **This pin is permanent** — EAS's `sdk-53`
image alias points at an Xcode 16 image Apple refuses.

### 3c. ITMS-90158 — an invalid URL scheme

`Info.plist` carried the literal placeholder scheme `fbYOUR_FACEBOOK_APP_ID`.
Underscores are not legal in URL schemes. Removed.

### 3d. The Facebook SDK was never configured

`app.json` still holds `YOUR_FACEBOOK_APP_ID` and `YOUR_FACEBOOK_CLIENT_TOKEN`.
Android logs four `OAuthException: Invalid application ID` responses per
launch. `initFacebookSDK()` is now a no-op behind `FACEBOOK_CONFIGURED = false`
in `src/services/facebookTracking.ts`, which documents how to re-enable it if
the client ever supplies real credentials. `trackEvent()` has **no callers**,
so nothing was lost.

### 3e. Crash reporting was never switched on

Sentry was wired correctly behind `services/sentry.shim` but gated on
`EXPO_PUBLIC_SENTRY_DSN`, which existed in `app/.env` and had **never been set
for builds**. Every build this project has ever produced shipped with reporting
silently disabled — which is why the crash had to be diagnosed from `.ips`
files. It also now initialises in `index.ts` **before** `App` is `require()`d,
because an error during module evaluation happens before `App.tsx` runs.

---

## 4. Traps that are still armed

**`app.json` configures nothing native.** `ios/` and `android/` exist, so EAS
ignores it — that is what §3a was. It prints this on every build, about the
bundle identifier, and it is easy to misread as being only about that. Native
settings live in `ios/Podfile.properties.json`,
`ios/LauriesLove/Supporting/Expo.plist`, `ios/LauriesLove/Info.plist`,
`ios/*.xcodeproj/project.pbxproj` and `android/gradle.properties`. **Keep the
two platforms in step.**

**Over-the-air updates — the same trap, now defused.** Both platforms had
`expo-updates` disabled natively (`Expo.plist`, `AndroidManifest.xml`), so
`eas update:configure`, which only writes `app.json`, would have reported
success and done nothing. **Fixed 22 Sept, in the native files** — see §8. The
general rule stands: any expo-updates setting has to be changed there.

**Apple distribution certificates are at the ceiling.** The team holds
**three**, which is the maximum. When EAS asks "reuse this distribution
certificate?", **always reuse**. A fourth forces a revoke, and
`561C51409BE567EC084939A91ED46F95` signs the only ACTIVE App Store profile for
the **live** app. Build 160 reuses that same certificate, which is safe —
sharing a certificate across apps is normal; creating a new one is not.

**Revert at cutover**, with the bundle identifier: `CFBundleDisplayName` is
`LL Beta` in both `app.json` and `ios/LauriesLove/Info.plist`. Do not put that
note back into the plist as an XML comment — Expo's config plugin rewrites that
file on every build and eats comments.

---

## 5. Accounts, keys and identifiers

| Thing | Value |
|---|---|
| Apple team | `49HFHLWS47` — Love Laurie's, Inc |
| ASC app (beta) | `6814278840` — `Lauries Love Beta` |
| ASC app (live, do not touch) | `1624981989` — `com.SMv587dd8da82c.app` |
| ASC API key | Key ID `6P4V2SDADW`, issuer `ade29a3c-2faf-4655-892c-b7ca292811d2`, `.p8` at `C:\Users\jerem\OneDrive\Desktop\AuthKey_6P4V2SDADW.p8` — **downloadable once; do not lose it** |
| Expo account | `lauries-love` (id `4233f460-cfe3-473e-bd35-17346dadc2a2`), paid plan, active |
| Expo project (beta) | `lauries-love-beta`, `101ddcd9-0197-48d7-800b-84b3bcc67bb2` |
| Expo project (live, do not touch) | `lauries-love`, `0a4266dd-1475-48c3-ad2d-a94b03fcddbc` |
| Sentry | org `skyway-media`, project `react-native`, DSN in `eas.json` |
| TestFlight internal group | `Team (Expo)`, `15361e88-5b7f-45b7-a465-13d00aa21ed8` |

**The Android upload keystore is in the client's Expo account**, on the
original project, for `com.lauriesloveapp` — alias `upload`, md5
`17d4a1295532f32f1d98382e6860a1f6`. `PROJECT-STATUS.md` recorded this as
blocked on "the Expo `lauries-love` org invite from Aaron". **It is no longer
blocked** — the invite happened on 21 Sept, so the Play Store update path is
open.

### Apple review demo account

Created on staging as an ordinary member, with a complete profile so a reviewer
lands in the app rather than in onboarding:

```
appreview@laurieslove.org  /  LLBeta-Review-2026
```

Alex R., Warrior (patient), breast cancer, diagnosed 2024, Austin TX. It is a
throwaway for Apple; delete or rotate it after the review. **Do not use
`jeremy@skyway.media` for testing the board experience** — it is a support
owner and shows staff features no board member will see.

### Sentry auth token

Deliberately **not** recorded here. It grants read access to the org. Generate
a fresh one at `https://sentry.io/settings/account/api/auth-tokens/` with
`event:read` and `project:read` when it is needed again.

---

## 6. What is left — updated 22 Sept

### iOS (the board)

1. ~~Decide on over-the-air updates~~ — **done**, enabled natively, in build
   161. See §8.
2. ~~External tester group + Beta App Review~~ — **done**. `Board Review`
   group created; build 161 submitted 21 Sept 23:01 PT. Review contact, demo
   account, reviewer notes, feedback email and beta description are all set in
   App Store Connect.
3. **Wait for Apple.** `WAITING_FOR_REVIEW` → `IN_REVIEW` → `APPROVED`,
   usually within 24h. Apple emails when it clears. Check with the API query
   in §8 rather than waiting on the email.
4. **Jeremy's bug list and UI changes.** Still outstanding. Most will ship as
   **over-the-air updates** (§8), so they do not need another build or another
   review — and the first one doubles as the proof that OTA works, which has
   **not yet been verified on a device**.
5. **Invite the board** once review clears *and* Jeremy is happy. **Six board
   members, list received 22 Sept** — held deliberately **out of the repo**
   because several are personal addresses; they are in the session
   transcript. Add them as external testers on `Board Review`. Public link vs
   individual invites is still undecided; the list suggests individual invites.

### Android (the boss, plus Android testers)

See §9. **Blocked only on a Google Maps API key.** Everything else is ready.

**Internal testing was considered and rejected.** It skips Apple review, but
every internal tester must be a **user on the client's App Store Connect
account**, with visibility of the live app. That is a governance decision for
the client, and the per-person friction is considerable — accepting a developer
invite, and signing the phone's **Media & Purchases** account into the right
Apple ID. External testing is one link and needs no account at all.

---

## 7. Also true, and worth not rediscovering

- **Mobile light mode shipped** (21 Sept). `PROJECT-STATUS.md` §5c called it
  deferred; that is now out of date. `colors.ts` picks the palette at module
  load from a preference read synchronously out of MMKV, so toggling reloads
  the app rather than repainting it. That was the deliberate trade to avoid
  converting 133 stylesheets.
- **The repo is self-contained.** Build variables live in `eas.json`, shared by
  the `staging`, `testflight` and `diagnose` profiles via `extends`. They are
  all `EXPO_PUBLIC_*`, which Expo inlines into the bundle, so they already ship
  inside every binary — holding them in EAS's server-side store bought no
  secrecy and had to be re-entered by hand every time the project moved.
- **The two Expo projects could not be merged.** Both were slugged
  `lauries-love`, and Expo has no slug rename — `setAppInfo` accepts
  `displayName` only. Hence a new project rather than a transfer.
- **Build numbers**: `autoIncrement` bumps `CFBundleVersion` locally, so
  `app.json` and `Info.plist` change on each build and need committing. The
  beta record has seen 156, 157, 158 and 160.
  Build 161 followed on 22 Sept.

---

## 8. Over-the-air updates (22 Sept)

**Enabled in build 161**, and it must stay compiled into anything the board
installs — an update can only reach a build that knows where to look.

It was done **in the native files, not `app.json`**, for the reason in §4.
Both platforms had `expo-updates` installed and explicitly disabled, with no
update URL:

| | Before | After |
|---|---|---|
| `ios/LauriesLove/Supporting/Expo.plist` | `EXUpdatesEnabled <false/>` | `<true/>`, plus `EXUpdatesURL` |
| `AndroidManifest.xml` | `expo.modules.updates.ENABLED false` | `true`, plus `EXPO_UPDATE_URL` |

URL: `https://u.expo.dev/101ddcd9-0197-48d7-800b-84b3bcc67bb2`.
`app.json` carries the same `updates.url`, because the `eas update` CLI reads
it — but the native files are what decide.

**Channels are per profile**: `testflight` and `diagnose`. So:

```
cd app
npx eas-cli update --branch testflight --message "what changed"
```

reaches build 161 and anything else built with the `testflight` profile. On
the device the update **downloads on one launch and applies on the next** —
testers need to open the app twice.

**Not yet verified on a device.** The config is explicit in both platform
files, but the first real fix is the proof. If it does not arrive, suspect the
channel/branch mapping before anything native.

**What OTA can and cannot change.** JavaScript, styles, copy, images bundled
with the JS: yes. Anything native — a new native module, `Info.plist`,
`AndroidManifest.xml`, the icon, the splash, permissions, the **Google Maps
key** — needs a full build.

**CAUTION — `runtimeVersion` is a fixed `"1.0.0"`** in `Expo.plist`,
`android/app/src/main/res/values/strings.xml` and `app.json`. Updates are
matched on it. **Any future change to native code must bump it in all three**,
or an update built for the new native code will be delivered to older builds
that cannot run it — and that is a crash on launch in the field.

### Checking Beta App Review without waiting for the email

The build's review state is on
`GET /v1/builds/826e1038-983f-4809-bd87-70cf82aa0828/betaAppReviewSubmission`,
authenticated with the ASC API key in §5.

---

## 9. Android (22 Sept)

**Decided: Google Play internal testing**, on the existing listing, for the
boss and any Android testers. The board is on iOS.

### Why Play and not direct APK links

The beta uses the **same package as the live app, `com.lauriesloveapp`** —
unlike iOS, where it got its own bundle ID. A directly-installed APK is signed
with a different key, so Android refuses to install it over the live app;
testers would have to uninstall the real one first.

Play avoids that entirely. **Google re-signs every upload with the production
app-signing key**, so a build delivered through Play installs as an ordinary
update. Testers opt in through a link and can opt out to go straight back to
the live app.

**The internal track cannot reach production users.** A build there stays
there unless someone explicitly promotes it. Still, it is the agency's live
listing — **tell the client before uploading**, rather than letting them find
out by noticing.

### Done

- **Upload keystore attached** to `lauries-love-beta` **by reference** —
  keystore `9446c7db-c084-4638-aa1a-5a218c27ba0a`, alias `upload`, md5
  `17d4a1295532f32f1d98382e6860a1f6`, **verified to match the live listing**.
  Nothing on the original project was changed. Play rejects anything signed
  with a different upload key, and a new keystore cannot update an existing
  listing.
- **`versionCode` 154 → 1000**, in `android/app/build.gradle` (what ships)
  and `app.json`. It had to clear the live app's 158; it jumps far past it on
  purpose. OneSeven are still shipping, and if we took 159 and they later
  built 159, **Play would reject theirs**.
- **Submit config**: `eas.json` → `submit.testflight.android` = track
  `internal`, `releaseStatus` `draft`, `changesNotSentForReview` true.
  Nothing rolls out on upload.

### Blocked: the Google Maps API key

Both native configs hold the literal placeholder `YOUR_GOOGLE_MAPS_API_KEY`.
**iOS is unaffected** — no map component specifies a provider, so it falls
back to **Apple Maps**, which needs no key. That is why nobody noticed.
**Android always uses Google Maps**, and with a placeholder key the Connect
map renders as a **blank grey square** — on the screen the swipe deck is
reached from.

It is native (`AndroidManifest.xml`, `com.google.android.geo.API_KEY`), so it
**cannot be fixed by an over-the-air update**. Build once the key arrives.

**Only one Google API is needed: Maps SDK for Android.** Checked in the code,
not assumed:

- Geocoding (`utils/geolocation.ts`, the map screen) is `expo-location`'s
  `geocodeAsync`, which uses the **device's own geocoder** — no Google API
- No Places or autocomplete anywhere
- No direct `maps.googleapis.com` calls
- Maps SDK for iOS is not needed (Apple Maps, above)

**The key fails silently if restricted wrongly.** An Android app restriction
needs package `com.lauriesloveapp` **and the SHA-1 of the app-signing
certificate from Play Console** (Setup → App integrity) — *not* the upload
key's, because Play re-signs. For testing, an unrestricted key or one limited
only to Maps SDK for Android is simplest; tighten it before launch. **Billing
must be enabled** on the Cloud project or it serves no tiles at all.

### No Play service account JSON

Not among the keys the other dev company sent. Optional — without it, upload
the `.aab` by hand: Play Console → Internal testing → Create release → drop the
file. To automate later: Play Console → Setup → API access → service account.

### Once the key arrives

1. Put it in `AndroidManifest.xml` (`com.google.android.geo.API_KEY`) — and in
   `ios/LauriesLove/Info.plist` `GMSApiKey` for tidiness, though iOS does not
   use it
2. `npx eas-cli build --platform android --profile testflight`
3. Upload the `.aab` to Play internal testing
4. Add testers, send the opt-in link

### Testers cannot use their real accounts

The beta talks to the **staging** Supabase database; the live app talks to the
old AWS/Cognito backend. Live credentials do not exist in staging. The 2,219
migrated members exist there as profiles but **cannot sign in** — Cognito
passwords cannot be migrated, and password reset needs SMTP, still
outstanding. **Testers should create a fresh account** — signup works, and
email confirmation is off on staging — or use the demo account.
