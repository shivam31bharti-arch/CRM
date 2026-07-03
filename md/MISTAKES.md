# Mistakes and Lessons Log

This file records observed mistakes and failed attempts. It is not a shame list; it prevents future
workers from repeating expensive guesses. Entries remain after correction.

## Entry format

- ID and date
- Context
- What happened
- Root cause or best-supported explanation
- Correction
- Prevention rule
- Status

## M-001 — Raw GitHub fetch used the wrong PowerShell command

- Date: 2026-06-22
- Context: CRM comparison research preceding implementation planning.
- What happened: `Invoke-WebRequest` returned an object-reference failure while reading raw GitHub
  text, so the requested license and README excerpts were not obtained in that attempt.
- Root cause: The command produced an unreliable response shape in the available PowerShell runtime.
- Correction: Retried the same official raw URLs with `Invoke-RestMethod`, which returned the text.
- Prevention rule: Use `Invoke-RestMethod` for raw text and JSON API responses in this environment;
  verify response content before relying on it.
- Status: Corrected.

## M-002 — Product scope was initially discussed as one broad upgrade

- Date: 2026-06-22
- Context: Planning essential CRM features and automation for teams up to 50.
- What happened: Companies, tasks, automation, governance, reporting, and integrations were initially
  grouped into a single broad roadmap, which would make review and completion ambiguous.
- Root cause: Feature prioritization was described before formal task boundaries and dependency gates
  were written.
- Correction: Split the program into independently testable milestones with explicit start and
  acceptance gates in `PLAN.md`.
- Prevention rule: When a request spans independent subsystems, create separate milestones before
  implementation and permit only one active milestone at a time.
- Status: Corrected in planning; must be enforced during implementation.

## M-003 — The first documentation verifier reported success around non-terminating errors

- Date: 2026-06-22
- Context: Verifying the new `md/` project-memory files.
- What happened: The relative-link checker used the nested pipeline `$_` match object as though it
  were the outer file object, producing null-path errors. PowerShell treated them as non-terminating,
  so the script continued and printed a misleading success line. The placeholder scan also matched
  the literal search expression documented in `VERIFICATION.md`.
- Root cause: Pipeline context was not captured before entering the nested match loop, strict error
  handling was absent, and the self-referential scan pattern was written literally.
- Correction: Capture the outer file in a named variable, enable `Stop` error behavior, and express
  the documented scan with equivalent non-literal character classes.
- Prevention rule: Verification scripts must fail closed: set terminating error behavior, avoid
  ambiguous nested `$_`, and check the verifier against its own documentation before recording a
  pass.
- Status: Corrected; clean rerun evidence is recorded in the 2026-06-22 completion entry in
  `WORKLOG.md`.

## Known risks that are not yet mistakes

- The repository contains a local demo social-account creation path using a mock token. It must not be
  treated as a production connection flow and should be removed or explicitly development-gated
  before production release.
- Company data is currently plain contact text. Migration must preserve it before any field removal.
- Existing activities are largely system-generated. Do not advertise complete activity management
  until create and permission paths are verified.
- Current command-center recommendations are read-only. Do not describe them as automation.

## M-004 — The first database backup used an older PostgreSQL client

- Date: 2026-06-23
- Context: Pre-deploy Supabase backup.
- What happened: Local `pg_dump` 16 refused to dump the Supabase PostgreSQL 17.6 server.
- Root cause: Major-version client/server mismatch.
- Correction: Used the official PostgreSQL 17 container client, validated the custom archive catalog
  and checksum, then restored it into a disposable PostgreSQL 17 server.
- Prevention rule: Match `pg_dump` major version to or above the server and prove restore, not only
  archive listing, before a production migration.
- Status: Corrected.

## M-005 — A committed migration was temporarily edited for local portability

- Date: 2026-06-23
- Context: Making the Supabase-role migration run on plain local PostgreSQL.
- What happened: The already-applied `20260614083000` migration was changed to conditionally handle
  missing roles, which would create migration-history drift without rerunning production behavior.
- Root cause: Local portability was solved inside immutable migration history.
- Correction: Restored the committed bytes, created the expected roles in CI/local test setup, and
  added a new forward-only hardening migration for newly discovered effective schema access.
- Prevention rule: Never rewrite an applied migration; compare `_prisma_migrations` checksums first
  and use a forward migration for corrections.
- Status: Corrected before deployment.

## M-006 — The first restore target was PostgreSQL 16

- Date: 2026-06-23
- Context: Proving the PostgreSQL 17 backup could restore.
- What happened: Restore into local PostgreSQL 16 failed on the PostgreSQL 17
  `transaction_timeout` setting; the next PostgreSQL 17 attempt also found the default `public`
  schema already present.
- Root cause: Restore rehearsal did not initially mirror the source major version and empty-schema
  state.
- Correction: Used an isolated PostgreSQL 17 container, dropped its empty `public` schema, restored
  with ownership/ACL excluded, and verified migration/contact/user counts.
- Prevention rule: Restore version-specific archives into the same major version and explicitly
  prepare an empty target schema.
- Status: Corrected.

## M-007 — Backfill fixture was first inserted after the migration it was meant to test

- Date: 2026-07-03
- Context: Replaying the company backfill fixture during final migration verification.
- What happened: The first attempt applied all migrations and then inserted the fixture, so the
  assertion correctly failed because the backfill migration had already run.
- Root cause: The test sequence did not match the historical production sequence for staged data.
- Correction: Recreated the disposable database, applied only pre-company migrations, inserted the
  fixture, applied `20260622230500_add_companies_and_contact_identity`, and reran assertions.
- Prevention rule: Backfill fixtures must be inserted immediately before the migration under test,
  never after the full chain has already completed.
- Status: Corrected; passing replay evidence is recorded in `WORKLOG.md`.

## M-008 — Read-only SQL verification used tools that did not print result rows

- Date: 2026-07-03
- Context: Post-deploy Supabase verification after applying the Google Workspace migration.
- What happened: `prisma db execute --stdin` executed successfully but did not print `SELECT` rows,
  so it was insufficient evidence. The first temporary TypeScript verifier also failed because of
  top-level `await` under CommonJS output; the second failed because the temp file was outside the
  repository and could not resolve `@prisma/client`.
- Root cause: The chosen verification path was not designed for result inspection, and the temporary
  script location did not share the project module resolver.
- Correction: Created a workspace-local temporary verifier, wrapped code in `main()`, queried via
  Prisma, printed JSON rows, and deleted the temporary file after use.
- Prevention rule: For row-level post-deploy evidence, use a verifier that prints structured output
  and lives in the workspace when it imports project dependencies.
- Status: Corrected.
