# Legacy Data Migration — Runbook

Everything discovered on **7 Sept 2026** while locating the old platform's data.
Written so the next session starts from the answers instead of rediscovering
them — finding this took several hours, mostly because the obvious places were
wrong.

**No secrets in this file.** Where credentials live is recorded; the values are not.

---

## 1. Headline numbers

| Thing | Reality | Notes |
|---|---|---|
| **Members** | **2,221** | NOT ~10k. That figure is repeated everywhere and is wrong. |
| Community posts | **494** | 2024-12-30 → 2026-09-04, still active |
| Likes | 1,106 | |
| Comments | ~783 claimed | Bodies survive only from ~Mar 2026; older ones deleted by retention |
| Direct messages | ~80 | Genuinely sparse. People post publicly, they rarely DM. |
| Sendbird cost | **$399/month** | ~$4,800/yr. The rebuild does not use Sendbird — cancel after cutover. |

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

Aurora MySQL 8.0. **Not publicly accessible** ("Internet access gateway:
Disabled"), so it can only be reached from inside the VPC.

- Reader endpoint: `laurieslove-production-cluster.cluster-ro-cxrztrhnnx8q.us-east-1.rds.amazonaws.com`
- Master username: `cesgicid`
- Password: **Secrets Manager → `laurieslove-rds-secret`** (LL-Prod, us-east-1)
- Schema: `laurieslove`

### Connecting (exact steps, known to work)

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

### ⚠️ The one unsolved blocker

**Getting the file out.** CloudShell VPC environments have **no file download**,
and the subnet is private with no NAT gateway or S3 endpoint, so
`aws s3 cp` hangs indefinitely with no error.

Two fixes, neither attempted yet:

- **(A) Recreate the CloudShell VPC environment in a *public* subnet.** Changes
  no infrastructure. Should still reach the DB (same VPC, security group
  permitting). **Try this first.**
- **(B) Add an S3 **Gateway** VPC endpoint.** Free, and a gateway endpoint is
  just a route-table entry rather than a running resource — but it does modify
  production networking, so it needs a deliberate decision.

Everything up to this point is proven. Only the extraction route is open.

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

`message_retention_hours` is 4380 (~6 months) — comment bodies older than that
are gone. Post bodies survived because channel `data` is not subject to message
retention. Filter out `sendbird_desk_agent_id_*` users; they are support
agents, not members.

---

## 6. S3 media (LL-Prod, us-east-1)

| Bucket | Contents |
|---|---|
| `laurieslove-post-prod` | Post images |
| `lauries-api-production` | API bucket |
| `039868711312-general-files` | General uploads |
| `039868711312-app-app` / `-admin-app` | Front-end hosting |

Volume not yet measured. Destination is Supabase Storage (`avatars`,
`post-images`), and the path convention there is `<uid>/<timestamp>.<ext>`.

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

1. Solve the extraction blocker (§3) — try the public-subnet CloudShell first.
2. Re-run the dump, pull `ll.sql` down.
3. Write the importer: MySQL → `profiles` + `profiles_private`, creating
   Supabase auth users via the Admin API. **Rehearse against staging**
   (`hcvyknwbixnlwqozmkas`) before production.
4. Sendbird posts → `posts` + `reactions`, joined on `cognito_id`. Cheap script,
   not a full importer — it is 494 rows.
5. S3 → Supabase Storage.
6. Configure SMTP (SMTP2GO) in Supabase Auth, then the password-reset campaign.
   Supabase's built-in SMTP is rate-limited and will not carry it.
7. Cancel Sendbird.

**Users must be imported before posts and messages** — both reference
`profiles.id` as a foreign key.

---

## 9. Handling

`ll.sql` contains names, emails, phone numbers, dates of birth and **cancer
diagnoses for 2,221 real people**. Keep it local, never commit it, never put it
in cloud storage, and delete it when the import is done. `.gitignore` should
cover `*.sql` dumps before anyone is tempted.
