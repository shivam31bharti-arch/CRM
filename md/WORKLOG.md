# Work Log

Append-only chronological record. Times use Asia/Calcutta unless an entry says otherwise.

## 2026-06-22 — Repository audit and implementation-memory setup

### Request

Create an implementation plan and supporting memory files before feature work; track completion,
steps, mistakes, and useful public Codex skills.

### Steps performed

1. Inspected Git status, root configuration, package scripts, README, source inventory, Prisma schema,
   route handlers, team onboarding, activity timeline, revenue intelligence, and Vercel cron.
2. Identified the highest-impact gaps for teams of 5–50: first-class companies, tasks/reminders,
   writable activities, a personal work queue, safe automation, centralized permissions, invitations,
   and audit history.
3. Queried official GitHub repository metadata for public agent-skill candidates.
4. Reviewed the complete selected skill instructions before using their planning method.
5. Installed focused skills from `obra/superpowers`: `writing-plans`, `executing-plans`,
   `test-driven-development`, `systematic-debugging`, and `verification-before-completion`.
6. Created the canonical `md/` memory structure and cross-linked its documents.
7. Split the product program into independently testable milestones rather than one oversized change.

### Files created

- `md/README.md`
- `md/REQUIREMENTS.md`
- `md/DECISIONS.md`
- `md/PLAN.md`
- `md/PROGRESS.md`
- `md/WORKLOG.md`
- `md/MISTAKES.md`
- `md/VERIFICATION.md`
- `md/RESEARCH.md`

### Verification evidence

Documentation verification is recorded in the completion entry appended after the files are checked.
No application test or build claim is made in this planning entry.

### Completion record — 2026-06-22 23:00:17 +05:30

- Confirmed exactly nine Markdown files exist and each is non-empty.
- Placeholder scan returned no matches.
- All relative Markdown file links resolved.
- `git diff --check -- md` exited `0` with no whitespace errors.
- `git status --short -- md` reports only the new untracked `md/` directory; files were not staged or
  committed.
- The first verifier attempt exposed a nested-pipeline and fail-open mistake. The causes, correction,
  and prevention rule are recorded as M-003 in `MISTAKES.md`; the corrected verifier then passed.
- Application tests, lint, audit, and build were intentionally not claimed in this documentation-only
  checkpoint. They remain the next baseline action in `PROGRESS.md`.

## 2026-06-22 — Milestone 1 baseline

### Branch

Created and switched from `main` to `codex/startup-crm-operations`. Existing modified, deleted, and
untracked files remained intact.

### Fresh verification evidence

- `npm run format:check` — exit `0`; all matched files use Prettier formatting.
- `npm run typecheck` — exit `0`.
- `npm run lint` — exit `0` with zero warnings allowed.
- `npm test` — exit `0`; 6 tests passed, 0 failed.
- `npm run audit` — exit `0`; 0 vulnerabilities reported.
- `npm run build` — exit `0`; Next.js 15.5.19 production build compiled and generated 16 static
  pages successfully.

This is the pre-feature baseline. Any later failure can be compared against this evidence.

## 2026-06-23 — Milestone 1, production migration, storage, and Google checkpoint

### Database safety and deployment

1. Confirmed production PostgreSQL 17.6 had three recorded migrations, with the historical
   Supabase-role migration checksum exactly matching committed history.
2. Confirmed zero production contacts and zero duplicate `TeamMember` users before migration.
3. Added explicit transactions to both pending multi-statement migrations and reran an empty Prisma
   chain plus the five-contact adversarial company-backfill fixture.
4. Created a PostgreSQL 17 custom-format backup outside the repository, recorded SHA-256
   `E3F74C0FB4CFD6E0C21AD8865BB1A18ABB6D1881374A52DF3AD6142D35431F32`, and restored it into a
   disposable PostgreSQL 17 server. The restore contained three migration rows, zero contacts, and
   four users.
5. Applied `20260621000000_harden_workspace` and
   `20260622230500_add_companies_and_contact_identity` to Supabase.
6. Post-deploy checks found no duplicate memberships, null active flags, normalization errors,
   unlinked companies, orphan links, or duplicate company identities; both foreign keys validated.
7. Effective privilege checks revealed that named-role revocation was insufficient because
   Supabase granted schema usage through `PUBLIC`. Added, clean-chain tested, and applied forward
   migration `20260623023000_harden_public_schema_access`.
8. Verified `anon` and `authenticated` now have no schema usage/create permission and zero accessible
   CRM tables; the application owner has no default grants to either role.

### Storage and integration implementation

- Implemented private storage references, exact MIME and signature checks, authenticated upload and
  delete routes, publish-time signed URLs, ownership validation, legacy HTTPS compatibility, and
  accessible composer controls.
- Initial storage checks passed 46 tests, typecheck, lint, dependency audit, and production build.
  Independent review then identified production blockers in multipart bounding, lifecycle, quota,
  expired provider versions, and channel media contracts. These are being corrected before a final
  completion claim.
- Approved and designed the Google Workspace milestone around Gmail metadata and the primary owned
  calendar with no message bodies, attachments, sending, or event mutation. Implementation is in
  progress; live provider tests remain configuration-gated.

### Verification state

This is a checkpoint, not a completion record. Full checks and browser verification must be rerun
after storage hardening and Google implementation settle.

## 2026-07-03 — Storage hardening, Google deployment, and verification completion

### Storage hardening

- Rechecked the storage review blockers and confirmed the implementation now uses a streaming Busboy
  parser instead of `request.formData()`, bounds total multipart bytes, accepts exactly one file
  field, enforces exact MIME/signature validation, and keeps the service-role client server-only.
- Confirmed post save/update/delete paths validate durable media ownership and clean up only
  unreferenced owned storage objects after successful database mutation.
- Confirmed upload quota guardrails, private-bucket checks without rejected-promise caching, and
  platform-specific media rules: X supports up to four media items, Facebook/Instagram currently
  accept the implemented image-only paths, and LinkedIn rejects media until asset upload is added.
- Found and fixed the remaining hard-coded Meta Graph `v19.0` OAuth/account-info URLs. The social
  connect route now uses the same validated `META_GRAPH_API_VERSION` setting as the publishing
  adapters. Added a regression test that failed before the fix and passed after it.

### Google Workspace and database deployment

- Verified the Google Workspace migration in a clean local disposable PostgreSQL database with all six
  migrations applied.
- Verified the Supabase hardening invariants locally after the full chain: `anon` and `authenticated`
  had no `public` schema usage/create and zero accessible public tables.
- Replayed the company backfill fixture in the correct migration order: pre-company migrations,
  fixture insert, company migration, assertions. Result: five contacts, two normalized companies, and
  three linked contacts.
- Before applying the final pending Supabase migration, created a PostgreSQL 17 custom-format backup
  outside the repository at
  `C:\Users\shiva\AppData\Local\Temp\crm-supabase-backups\crm-supabase-pre-google-20260701-110332.dump`.
  SHA-256: `1675F077B1D7C785D848E8A9B1EA773FA5C176E59904588EBE1140F85BD8F5F4`.
- Applied `20260623090000_add_google_workspace` to Supabase with `npx prisma migrate deploy`.
- Post-deploy Prisma status reports all six migrations up to date.
- Post-deploy read-only checks confirmed `20260623023000_harden_public_schema_access` and
  `20260623090000_add_google_workspace` are finished and not rolled back; `anon` and
  `authenticated` still have no public usage/create and zero accessible tables; `GoogleConnection`
  table and `GoogleSyncTrigger` enum exist.

### Fresh verification evidence

- `npm run format:check` — exit `0`; all matched files use Prettier style.
- `npm run typecheck` — exit `0`.
- `npm run lint` — exit `0` with zero warnings allowed.
- `npm test` — exit `0`; 67 tests passed, 0 failed.
- `npm run audit` — exit `0`; 0 production high-or-greater vulnerabilities.
- `npm run build` — exit `0`; Prisma client generated and Next.js production build completed.
- Browser/local runtime check: seeded only the disposable local database; logged in as
  `admin@demo.com / Demo1234!`; dashboard rendered with seeded data; dev server logs showed 200s for
  `/settings/integrations`, `/scheduler/compose`, `/companies`, `/contacts`, and the related API
  calls. Browser console extraction timed out twice, so this remains a lightweight smoke check rather
  than a full browser gate.

### Cleanup

- Removed the temporary workspace-local Supabase verifier file.
- Dropped the disposable local databases `crm_verify_20260701` and `crm_backfill_20260701`.
- Stopped the local Postgres service used for verification.
- Left an unrelated orphan Redis container untouched.
