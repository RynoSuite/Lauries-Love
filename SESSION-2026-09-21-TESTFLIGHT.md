# TestFlight for the board — 20/21 Sept 2026

**The mobile app is on TestFlight and it works.** This is the record of getting
it there, because almost nothing about it was obvious and five of the blockers
pre-dated the session.

Read `PROJECT-STATUS.md` first for the project as a whole. This file covers the
iOS delivery pipeline and what remains before board members can install it.

---

## 1. State at the end of the session

| | |
|---|---|
| **Working build** | **160**, in TestFlight, verified installed and running on a real iPhone |
| **App Store Connect app** | `Lauries Love Beta`, Apple ID **6814278840**, bundle `org.laurieslove.staging` |
| **Expo project** | **`@lauries-love/lauries-love-beta`**, id `101ddcd9-0197-48d7-800b-84b3bcc67bb2` — the CLIENT's account, on their paid plan |
| **Branch** | `testflight-board-review`, 17 commits, **not merged to main** |
| **Home-screen name** | **`LL Beta`** — so it does not collide with the live app |
| **Backend** | staging (`hcvyknwbixnlwqozmkas`) — the migrated community, not production |
| **Crash reporting** | Sentry `skyway-media/react-native`, working, readable |

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

**Over-the-air updates are disabled natively.**
`ios/LauriesLove/Supporting/Expo.plist` has `EXUpdatesEnabled` `<false/>`.
Running `eas update:configure` writes `updates.url` into `app.json`, reports
success, and **does nothing on iOS**. Enabling OTA means editing that plist and
verifying on a device. See §6.

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

## 6. What is left before the board can install it

1. **Jeremy's bug list and UI changes** — testing was still in progress when
   the session ended.
2. **Decide on over-the-air updates.** Without them every change is a ~20
   minute rebuild that every board member must install by hand; with them a
   JavaScript change reaches them in about a minute, automatically. It **must
   be compiled into the build the board installs** — adding it later means
   everyone reinstalls. Needs the `Expo.plist` change in §4, and should be
   proved on an ad-hoc build before it goes anywhere near the board.
3. **External tester group + Beta App Review.** Board members are not App Store
   Connect users, so they need external testing, which requires Apple to review
   the build — roughly 24 hours, once. **Start it before the fixes land**: once
   the group is approved, later builds usually clear quickly. Apple needs a
   review contact name, phone and email, plus the demo account above.
4. **Invite the board** — a public link (lowest friction, and what the live
   app's `Clients` group already uses) or individual emails.

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
