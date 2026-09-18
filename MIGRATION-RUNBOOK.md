# Legacy Data Migration — Runbook

Written 7 Sept 2026 while locating the old platform's data, so the next
session starts from the answers instead of rediscovering them.

**Updated 18 Sept 2026: the migration has been RUN against staging.** Three
things this file previously asserted turned out to be wrong, and each one is
marked inline rather than quietly deleted, because the reasoning behind the
mistake is the useful part:

- **§3 — the database is publicly accessible.** It was described as
  VPC-only, which sent two sessions toward CloudShell and S3 gateway endpoints
  that were never needed.
- **§5 — 160 of the 494 posts did not survive**, not 0. And 740 of 783
  comments are gone.
- **§6 — post images are done; the 222 avatars are in a private bucket** and
  are now the only thing still needing AWS access.

**No secrets in this file.** Where credentials live is recorded; the values are not.

---

## 1. Headline numbers

"Existed" is what the old platform recorded. "Migrated" is what is in staging
as of 18 Sept. Where they differ, §5 explains why.

| Thing | Existed | Migrated | Notes |
|---|---|---|---|
| **Members** | **2,221** | **2,219** | NOT ~10k. That figure is repeated everywhere and is wrong. The 2 are our own already-registered accounts. |
| Community posts | 495 channels | **318** | 160 have no recoverable body; 17 by deleted accounts. Feed spans 2025-03-18 → 2026-09-09. |
| Likes | 1,108 | **1,028** | The rest belong to deleted accounts. |
| Comments | 783 claimed | **43** | 740 were messages, and retention deleted them. Unrecoverable. |
| Friendships | 292 | **284** | 66 accepted, 218 still pending. |
| Post images | 40 | **39** | |
| Profile avatars | 222 | **0** | Private S3 bucket — the one remaining blocker. See §6. |
| Direct messages | ~1 | 0 | Not "~80 and skipped" — sampling found one message in total. There is nothing there. |
| Diagnoses | 2,105 | — | One per member; 116 members have none. |
| Sendbird cost | **$399/month** | | ~$4,800/yr. The rebuild does not use Sendbird — cancel after cutover. |

Two data-quality findings that shaped the import, both in §4:
**`state` was never stored** (derived from ZIP), and **the legacy coordinates
are wrong for a quarter of the community.**

---

## 2. AWS — where things actually are

The client owns everything. One Seven Tech only has IAM users; they are **not**
holding the infrastructure hostage. An earlier assumption that they were was
wrong.

It is an **AWS Organization with three accounts**:

| Account | ID | Contents |
|---|---|---|
| Laurie's Love (management) | `422317780393` | Billing + an empty networking shell. **Consoles look empty here — that is normal.** Consolidated billing shows the members' charges, which is what made this confusing. |
| **Laurie's Love Prod** | `039868711312` | **Everything real.** |
| Laurie's Love Dev | `525947738364` | |

**Get into Prod** (from the management account, needs AdministratorAccess):

```
https://signin.aws.amazon.com/switchrole?account=039868711312&roleName=OrganizationAccountAccessRole&displayName=LL-Prod
```

Both member accounts were *created* by Organizations, so `OrganizationAccountAccessRole`
exists automatically and trusts the management account.

**Always check the region is `us-east-1`.** Several dead ends today were just
the console sitting on `us-east-2`.

---

## 3. The database — TWO clusters, only one is live

In **LL-Prod / us-east-1**:

| Cluster | Status |
|---|---|
| **`laurieslove-production-cluster`** | **LIVE — 2,221 users.** Use this one. |
| `laurieslove-prod` | **STALE.** Last signup 2024-11-20, 113 users. Abandoned when they moved infrastructure around Dec 2024 (the `lauries-api-production` S3 bucket is dated 22 Dec 2024). |

Aurora MySQL 8.0.

> **CORRECTED 18 Sept.** This section used to say the cluster was "not publicly
> accessible, so it can only be reached from inside the VPC". **That was wrong,
> and it cost two sessions.** The note was taken from the STALE
> `laurieslove-prod` cluster, which does sit in a private-subnet VPC. The LIVE
> cluster is in the **default VPC** (`vpc-07dbb4c0ad7c2c6cf`) with
> **`Publicly accessible: Yes`**, and its security group (`sg-0272f79ebba1da009`)
> has a single inbound rule: **3306 from `0.0.0.0/0`**.
>
> It can therefore be read from any machine with the password, which is how the
> export was actually done — see `scripts/export-legacy.mjs`. Everything below
> about CloudShell and S3 gateway endpoints is kept only as a record of a route
> that turned out to be unnecessary.

**This is also a security finding for the client.** A production database
holding names, emails, dates of birth and cancer diagnoses for 2,221 people
accepts connections from anywhere on the internet, with a password as the only
control. It should be closed — but **not by deleting that rule.** It is the
only inbound rule on the group, so the legacy application servers are relying
on it too; removing it would take the live app down. The sequence is: identify
what legitimately connects (the app's security group or its Elastic IPs), add
explicit rules for those, verify the app still works, then remove `0.0.0.0/0`.

- Reader endpoint: `laurieslove-production-cluster.cluster-ro-cxrztrhnnx8q.us-east-1.rds.amazonaws.com`
- Master username: `cesgicid`
- Password: **Secrets Manager → `laurieslove-rds-secret`** (LL-Prod, us-east-1)
- Schema: `laurieslove`

### Connecting — the way that was actually used

```
LL_RDS_PASSWORD=... node scripts/export-legacy.mjs C:/somewhere/outside/the/repo
```

Password: **Secrets Manager → `laurieslove-rds-secret`** (LL-Prod, us-east-1).
The script needs `mysql2`, which is not a dependency of this repo — install it
in a scratch directory and point `NODE_PATH` at it.

It writes `members.ndjson` (2,221), `diagnosis-types.ndjson` (2,105),
`diagnosis-subtypes.ndjson` (787), `friendships.ndjson` (292),
`definitions.ndjson` (73) and `payments.ndjson` (14), and fails loudly if the
member count is not 2,221.

Note `scripts/export-legacy.sql` is **superseded and would not run**: written
before anyone had access, it guessed TypeORM's camelCase column names
(`u.roleId`, `fr.senderId`, `j.valuesDefinitionId`) where the live schema is
snake_case throughout.

### The CloudShell route (unnecessary — kept for the record)

1. In LL-Prod, RDS → click the cluster → **Launch CloudShell**. It prefills the
   VPC, subnets and security group for you — do not build the VPC environment
   by hand.
2. Name it anything (`ll-export`).
3. Run the prefilled `mysql` command, paste the password when prompted.

**CloudShell paste breaks on long lines.** Split commands into two:

```bash
H=laurieslove-production-cluster.cluster-ro-cxrztrhnnx8q.us-east-1.rds.amazonaws.com
mysql -h $H -u cesgicid -p -B -e "select * from laurieslove.user" > users.tsv
```

Full dump (worked, produced 4.6MB):

```bash
mysqldump -h $H -u cesgicid -p --single-transaction --no-tablespaces laurieslove > ll.sql
```

If the terminal starts echoing commands without running them, it has a paste
backlog — Ctrl+C a few times until the prompt is clean.

### Getting the file out

CloudShell VPC environments have **no file upload or download** — a documented
limitation of VPC environments, not something a different subnet fixes. The
environment's ENI also never gets a public IP, so a public subnet gives it no
internet egress either; only a NAT gateway would, and this VPC has none. An
earlier draft of this runbook said to try a public subnet first. It would not
have worked.

**The route that works: an S3 gateway endpoint.** Free, not a running resource
— just an entry in the route table — and removable afterwards. Traffic to S3
stays on the AWS network and never crosses the internet, which for 2,221
people's diagnoses is the point.

1. **VPC → Endpoints → Create endpoint.** Service category "AWS services",
   search `s3`, choose the one of **Type: Gateway** (there is an Interface
   one too; that costs money and is not what you want). Pick the cluster's
   VPC, tick the route tables for the DB subnets, create.
2. Back in CloudShell, `aws s3 cp` works.
3. Copy the export up, download it from the S3 console, then **delete the
   object.** It is unencrypted PII sitting in a bucket.
4. Remove the endpoint afterwards if you would rather leave the VPC as found.

Check first whether the VPC already has one: **VPC → Endpoints**, filtered by
the VPC. If `com.amazonaws.us-east-1.s3` is there as a Gateway, the route
table for the CloudShell subnet may simply not be associated with it.

**Fallback if networking changes are refused:** RDS → Snapshots → manual
snapshot → **Export to Amazon S3**. Fully managed, changes no networking,
writes Parquet. It costs a little and the output needs a Parquet reader, so it
is the second choice rather than the first.

---

## 4. Old schema → new schema

The old TypeORM entities are in `api/libs/database/src/entities/` and document
the schema exactly, so no reverse-engineering is needed.

**`user.cognito_id` is the join key** across all three systems:

```
Sendbird user_id  ==  Cognito sub  ==  laurieslove.user.cognito_id  ->  new profiles.id (UUID)
```

`user` columns worth mapping: `id`, `cognito_id`, `email`, `display_name`,
`first_name`, `last_name`, `phone_number`, `dob`, `city`, `state`, `country`,
`zip_code`, `age`, `gender`, `diagnosis_year`, `diagnosis_date`, `description`,
`profile_picture`, `config` (JSON — holds Authorize.Net customer profile ids),
`geo_location` (JSON), `created_at`, `active`.

Diagnoses come from `user_diagnosis_types_values_definition` and
`user_diagnosis_sub_types_values_definition` joined to `values_definition`.

**Cognito is not needed.** It only ever held passwords, which cannot be
exported. MySQL has every profile field. Every migrated member resets their
password on first sign-in — the web flow for that is built
(`/forgot-password`, `/reset-password`) and matches the mobile app's 6-digit
code flow.

Split on arrival: public fields → `profiles`; email/phone/zip/DOB →
`profiles_private` (owner-only by RLS).

### Four things the old schema gets wrong, found 18 Sept

**1. `state` does not exist.** NULL for all 2,221 rows — the old platform never
stored it. It is **derived from `zip_code`** (present for 2,173) by
`scripts/zip-state.mjs`: ZIPs are allocated in contiguous ranges by state, so
this is a lookup, not a guess. 2,152 members now have one.

**2. The coordinates are wrong for a quarter of the community.** The old
platform geocoded the **city name with no state** — because it had no state to
geocode with — and took whatever the geocoder returned first:

```
Morgantown   zip says KY -> point is Morgantown, WEST VIRGINIA
Garden City  zip says MO -> point is Garden City, NEW YORK
Taylorsville zip says KY -> point is Taylorsville, UTAH
Montgomery   zip says TX -> point is Montgomery, ALABAMA
```

**356 members are plotted in the wrong state, and 144 sit at exactly `0,0`** —
the Atlantic, off West Africa. So **the ZIP decides the state, and coordinates
must agree with it to survive**: 547 sets are dropped, and those members keep
their city and state as text but have no map pin. Showing someone in the wrong
state is worse than not showing them, in an app whose purpose is finding people
nearby. They are recoverable later from a ZIP-centroid dataset, which would sit
well inside the ~3.5 mile grid every coordinate is coarsened to anyway.

**3. `last_name` is not used.** Only 19 of 2,221 have one; the full name is in
`first_name` ("Brittney Sprout"), and `display_name` holds the same string.
**Left as-is deliberately** — splitting on a space mangles "Mary Anne Smith",
hyphenated and multi-part surnames, and the app displays `display_name`
everywhere, so nothing visible is wrong.

**4. `designation_id` is NULL for all 2,221**, so the Warrior / Caregiver /
Friend / Family Member role — which the new app uses for group matching and map
filters — has **no source in MySQL at all**. It may be partly recoverable from
Sendbird's `recommendedGroups` (186 posts are tagged "warrior (patient)", 26
"family member", 11 "caregiver"), but that is a post's audience, not the
author's own role. **Every imported member currently has no role.**

Also worth knowing: `role_id` is a different field (Basic / Admin / Super Admin
/ Guest) and reads **125 Admin and 85 Super Admin** out of 2,221. It was NOT
imported; everyone defaults to Basic. Granting admin is a deliberate act.

Diagnosis vocabulary has one flaw carried over: codes **113 and 114 are both
"Ovarian Cancer"** (28 and 66 members), so the same option appears twice with
its members split across it.

---

## 5. Sendbird — the feed is NOT in the messages

The single most important gotcha here. Posts are **not** Sendbird messages.
Each post is a **group channel whose `data` field holds JSON**:

```json
{"type":"post","visibility":"public","recommendedGroups":["warrior (patient)"],
 "likes":["<uuid>","<uuid>"],"commentQty":4,"firstMessage":"<the post body>"}
```

Querying `/messages` alone shows ~80 results and gives the false impression the
app is dead. Query `/group_channels` and parse `.data` instead.

- Prod application: `EAD0FC5B-45E7-4029-90C1-32730AC76B5D`
- Staging application: `5736C7F4-2635-4CDA-BAD3-52FDD8E0469D`
- Master API tokens: Sendbird Dashboard → Settings → Application → API tokens.
  **Rotate these after migration** — they can read every message in the app.

Base URL `https://api-<APP_ID>.sendbird.com/v3`, header `Api-Token: <token>`.
Useful endpoints: `/group_channels?limit=100&show_empty=true` (paginate on
`next`), `/group_channels/<url>/messages/total_count`, `/users?limit=100`.

`message_retention_hours` is 4380 (~6 months). Filter out
`sendbird_desk_agent_id_*` users; they are support agents, not members.

### What actually survived — measured 18 Sept, not estimated

> **CORRECTED.** This section used to say "post bodies survived because channel
> `data` is not subject to message retention". The reasoning is right; the
> premise is not. **`firstMessage` was not always written.**

Of **495 post channels**:

| | |
|---|---|
| **316 imported** | body present, author resolvable |
| **160 unrecoverable** | no `firstMessage`, no `firstMessageId`, zero messages left in the channel |
| 17 skipped | author exists in Sendbird but not in the member table — deleted accounts |
| 2 | image-only; imported with the post images |

The 160 were created between **Dec 2024 and mid-March 2025**. The two
populations meet in March 2025, which is evidently when the old app started
caching the body into channel `data`; before that the body lived only as a
message, and retention deleted it long ago. **They are gone** — the API has
nothing left to give.

**Comments are worse: 783 claimed in `commentQty`, 43 survive.** Comments only
ever existed as messages, so only the last ~6 months remain. The gap is not
recoverable.

Likes are fine — 1,108 in channel `data`, 1,028 imported (the rest belong to
deleted accounts).

**Direct messages: there is nothing there.** The runbook previously estimated
~80 in total. Sampling eight two-member channels returned **one message**
between them. 320 of the 817 channels are DM channels with no `data` and no
surviving messages. The decision not to import them is not a trade-off, it is
an absence.

Author is `created_by.user_id` on the channel — the Cognito sub, and therefore
`profiles.legacy_cognito_id`. `recommendedGroups` maps to `posts.audience_tags`
(see `20260702165624_post_audience_tags.sql`), NOT to `group_id`: only 3 posts
have real group visibility.

Scripts: `scripts/export-sendbird.mjs` then `scripts/import-sendbird.mjs`.

---

## 6. S3 media (LL-Prod, us-east-1)

| Bucket | Contents |
|---|---|
| `laurieslove-post-prod` | Post images |
| `lauries-api-production` | API bucket |
| `039868711312-general-files` | General uploads |
| `039868711312-app-app` / `-admin-app` | Front-end hosting |

Destination is Supabase Storage (`avatars`, `post-images`), path convention
`<uid>/<timestamp>.<ext>` — the storage policies require the first segment to
be the owner's uid.

**Post images: done.** 40 in the export, **39 imported**. `laurieslove-post-prod`
is **public**, so no AWS credentials were needed — the URLs in
`posts.ndjson` were fetched over HTTPS. See `scripts/import-post-images.mjs`.
The one skipped belongs to a post by a deleted account.

**Avatars: BLOCKED, and the only thing still needing AWS access.** 222 members
have a `profile_picture`, stored as a bare S3 key with no bucket recorded:

```
users/<cognito_id>/profilePhotos/<uuid>.jpg
```

Neither candidate bucket serves it publicly — `lauries-api-production` and
`039868711312-general-files` both return **403**, and `laurieslove-post-prod`
returns 404 (wrong bucket). So this needs either a temporary public-read grant
or a read-only IAM key scoped to those buckets. Once readable, the script
pattern is identical to `import-post-images.mjs`.

---

## 7. Also found

- **Authorize.Net** credentials are in Secrets Manager: `prod/authorize.net/api_login`
  and `prod/authorize.net/client_key`. Relevant when donation continuity comes up.
- `DEV-HANDOFF-REQUEST.md` is a 22-item request Aaron sent One Seven Tech, all
  unchecked. **Unchecked does not mean undelivered** — that inference was made
  and was wrong. Ask Aaron directly what actually arrived.
- Item 6 of it — the **App Store listing transfer** — is still worth confirming
  independently, because it decides whether app updates reach the existing
  users.

---

## 8. Order of work

**Steps 1–5 are DONE against staging (`hcvyknwbixnlwqozmkas`), 16–18 Sept.**
Nothing has been run against production yet.

1. ~~Solve the extraction blocker~~ — there was none. The cluster is publicly
   accessible; see the correction in §3. CloudShell and the S3 gateway endpoint
   were not needed.
2. ~~Export~~ — **done.** `scripts/export-legacy.mjs`. 2,221 members, every
   line valid JSON, 2,221 unique emails and cognito ids.
3. ~~Members~~ — **done. 2,219 of 2,221 imported.** The 2 failures are
   `j.marshall@` and `jeremy@skyway.media`, whose Supabase accounts already
   existed; reported and skipped, never overwritten. Their legacy profile
   fields have NOT been merged into the accounts they sign into — still open.
4. ~~Sendbird~~ — **done. 318 posts, 43 comments, 1,028 likes.** See §5 for
   what did not survive. Also **284 of 292 friendships**
   (`scripts/import-friendships.mjs`); pending requests stay pending, because
   accepting them would fabricate relationships that never existed.
5. ~~S3~~ — **post images done (39 of 40); avatars blocked on AWS access.**
   See §6.
6. **Configure SMTP (SMTP2GO) in Supabase Auth, then the password-reset
   campaign.** Supabase's built-in SMTP is rate-limited and will not carry
   2,200 messages. Still blocked on the client.
7. **Production cutover** — run everything above against
   `iwbfsbriippzmdyrsmsu`, which has had NO migrations applied at all. Clear
   the demo data first (`supabase/seed/demo_members_remove.sql`) so the post-
   import count is exactly 2,221 rather than "4,531, probably".
8. **Cancel Sendbird** ($399/month) and the AWS accounts.

**Users must be imported before posts, friendships and images** — all three
reference `profiles.id` as a foreign key, resolved via `legacy_cognito_id`.

### Run order, for the production pass

```
node scripts/export-legacy.mjs   <dir>          # needs LL_RDS_PASSWORD
node scripts/export-sendbird.mjs <dir>          # needs SENDBIRD_TOKEN
node scripts/import-legacy.mjs      --file <dir>/members.ndjson --dry-run
node scripts/import-legacy.mjs      --file <dir>/members.ndjson
node scripts/import-sendbird.mjs    --dir  <dir>
node scripts/import-friendships.mjs --file <dir>/friendships.ndjson
node scripts/import-post-images.mjs --dir  <dir>
```

Every importer takes `--dry-run` and is idempotent on a legacy key
(`legacy_id`, `legacy_channel_url`, or the friendship pair), so a run that dies
part way can simply be repeated.

**Rotate afterwards:** the RDS password, the Sendbird master API token (it can
read every message in the app), and the Supabase service role key.

---

## 9. Handling

The export contains names, emails, phone numbers, dates of birth and **cancer
diagnoses for 2,221 real people**. Keep it local, never commit it, never put it
in cloud storage, and delete it once the import is verified.

`.gitignore` covers `*.sql`, `*.ndjson` and `users.tsv` — as a second line of
defence, not as permission. **Write the export outside the repository
entirely.** The staging pass used `C:\Users\jerem\ll-legacy-export\`, which
still holds it and should be deleted once production has been cut over.

Credentials used during the staging pass and **due for rotation**: the RDS
master password, the Sendbird master API token, and the Supabase staging
service role key. All three were handled in a session transcript.
