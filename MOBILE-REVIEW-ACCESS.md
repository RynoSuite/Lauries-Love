# Getting the app on a phone for a client review

For a colleague who is not a developer and is not on the same network as the
dev machine.

**The short version: they do not need the repo, Claude Code, Node, or any dev
setup. Jeremy runs one command and sends them a link. They tap it and install.**

---

## Why the build already on Jeremy's phone will not work for them

That is a **development build**. It contains no JavaScript of its own — it
fetches it from the Metro server running on Jeremy's laptop, over the local
network. On another network it opens to a blank screen or a connection error.

What they need is a **staging build**, which has the JavaScript baked in and
runs on its own. Same app, same staging database, no laptop involved. The
`staging` profile in `eas.json` already produces exactly this.

---

## Part 1 — What Jeremy does

### If the colleague has an Android phone

One command, from `app/`:

```
npx eas build --profile staging --platform android
```

When it finishes, EAS prints a build page URL. Send that link. Done.

### If the colleague has an iPhone

Apple will not let an app onto a phone it has never heard of, so the device has
to be registered **before** the build. This is why it needs starting today
rather than in the morning.

1. Register the device:

   ```
   npx eas device:create
   ```

   Choose "Website" — it prints a URL and a QR code.

2. Send that link to the colleague. They open it **on the iPhone**, in Safari,
   and follow the prompts to install a profile. It registers the phone with the
   Apple team; it does not install the app yet.

3. Once they confirm it is done, build:

   ```
   npx eas build --profile staging --platform ios
   ```

   Apple credentials are needed here: the client's team, `49HFHLWS47`.

4. Send them the build page URL.

**Every new iPhone needs steps 1–3 again, including a fresh build.** Android
has no equivalent restriction.

### Before sending the link

Open the build page yourself and check the build **succeeded**. A failed build
still produces a link, and it is better to find that out than to have the
colleague find it ten minutes before the call.

---

## Part 2 — What the colleague does

Send them this part.

### Android

1. Open the link on your phone.
2. Tap **Install**. It downloads an `.apk`.
3. Android will warn about installing from an unknown source. Allow it for your
   browser, then tap the downloaded file again.
4. Open **Laurie's Love** from your home screen.

### iPhone

1. First, open the **registration link** in Safari on the iPhone and follow the
   prompts. You will be asked to allow a download, then to install a profile in
   **Settings → Profile Downloaded**. This just tells Apple your phone is
   allowed to run the app.
2. Tell Jeremy it is done, and wait for the **build link**.
3. Open the build link on the iPhone, tap **Install**.
4. Go to **Settings → General → VPN & Device Management**, find the developer
   profile, and tap **Trust**. iOS will not open the app until you do.
5. Open **Laurie's Love** from your home screen.

### Signing in

Ask Jeremy for a test account. The app is pointed at the **staging** database,
so nothing done in it touches real member data — post, join groups and send
messages freely.

### If something looks wrong

Say what screen you were on and what you expected. Screenshots help. Do not
worry about whether it is "a real bug" — reporting something that turns out to
be intended costs a minute, and not reporting something real costs the demo.

---

## Timing

EAS builds take roughly 15–25 minutes, and the free plan queues behind other
people's builds, so it can be longer at busy times. For a review tomorrow,
start the build today. An iPhone needs the extra registration round trip
first, so start that even earlier.

---

## What this does not need

- The repo
- Claude Code
- Node, Xcode, Android Studio
- The colleague to be on any particular network
- A Metro server running anywhere

If someone is following instructions that involve `npm install` or `npx expo
start`, they are on the development-build path and it will not work remotely.

---

## Two things worth knowing before the client sees it

- **The splash screen is still the old artwork** on any build made before the
  next native rebuild. The rebrand is in the code; it needs a build to appear.
  A staging build made now will include it.
- **The app icon is still the old mauve logo on white.** Same reason, and it
  has not been redone yet. If the client is looking at the home screen, expect
  that question.
