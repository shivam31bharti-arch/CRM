# Startup CRM Operations Implementation Plan

> **For agentic workers:** Use the installed `executing-plans`, `test-driven-development`,
> `systematic-debugging`, and `verification-before-completion` skills as applicable. Execute inline
> unless the user explicitly requests subagents. Track every step with checkboxes and update the
> project memory files after verification.

**Goal:** Turn the existing CRM framework into a dependable operating system for startup teams of
5–50 by adding companies, owned work, safe automation, governance, and selected integrations.

**Architecture:** Extend the existing Next.js modular monolith with focused domain services between
route handlers and Prisma. Domain mutations emit typed internal events for immediate automation;
one idempotent workspace tick processes scheduled rules and publishing. Keep the UI server-first and
use small client components only for interactive forms, boards, and optimistic task updates.

**Tech stack:** Next.js 15.5, React 18, TypeScript, Prisma 5, PostgreSQL, NextAuth 5 beta, Zod,
TanStack Query, Tailwind CSS, Node test runner through `tsx`.

## Global constraints

- Preserve the existing dirty working tree; never reset or overwrite unrelated changes.
- Maintain the single-workspace assumption until ADR-001 is superseded.
- Keep the current daily Vercel schedule; the production target is hourly.
- Never initialize Prisma or provider SDK clients in browser code.
- Never return encrypted or decrypted credentials in API selections.
- Use server-side authorization on every mutation; UI hiding is not authorization.
- Use typed allowlists for automation; no arbitrary code execution or arbitrary webhooks.
- Use red-green-refactor for behavior changes and fresh verification before completion claims.
- Apply schema changes through committed Prisma migrations; never use destructive schema push in
  production.
- Update `PROGRESS.md`, `WORKLOG.md`, and `MISTAKES.md` at every implementation checkpoint.

---

## Milestone 0 — Planning and safety baseline

**Deliverable:** A durable memory system, confirmed assumptions, and a clean verification baseline.

**Files:**

- Create: `md/README.md`
- Create: `md/REQUIREMENTS.md`
- Create: `md/DECISIONS.md`
- Create: `md/PLAN.md`
- Create: `md/PROGRESS.md`
- Create: `md/WORKLOG.md`
- Create: `md/MISTAKES.md`
- Create: `md/VERIFICATION.md`
- Create: `md/RESEARCH.md`

- [x] Inspect existing application routes, schema, UI modules, tests, and deployment schedule.
- [x] Separate confirmed constraints from recommended assumptions.
- [x] Select reviewable implementation skills and record their provenance.
- [x] Create the project memory documents.
- [ ] Receive user confirmation for market focus, first communications provider, and automation
      author permissions.
- [x] Run and record the full baseline verification suite immediately before feature implementation.

**Acceptance gate:** All memory files exist, cross-links resolve, no placeholder markers are present,
and the baseline verification result is recorded without claiming unrun checks.

---

## Milestone 1 — Companies and relationship data quality

**Deliverable:** First-class companies, staged migration of existing company text, and duplicate-aware
contact creation/import.

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_companies_and_contact_identity/migration.sql`
- Create: `lib/domain/contacts/identity.ts`
- Create: `lib/domain/companies/service.ts`
- Create: `lib/validations/companies.ts`
- Create: `app/api/companies/route.ts`
- Create: `app/api/companies/[id]/route.ts`
- Create: `app/(dashboard)/companies/page.tsx`
- Create: `app/(dashboard)/companies/[id]/page.tsx`
- Create: `components/companies/CompanyForm.tsx`
- Create: `components/companies/CompanyList.tsx`
- Modify: `app/api/contacts/route.ts`
- Modify: `app/api/contacts/[id]/route.ts`
- Modify: `app/api/contacts/import/route.ts`
- Modify: `components/contacts/ContactForm.tsx`
- Modify: `app/(dashboard)/contacts/[id]/page.tsx`
- Modify: `lib/constants.ts`
- Create: `tests/contact-identity.test.ts`
- Create: `tests/company-validation.test.ts`

- [ ] Write failing normalization tests for trimmed lowercase email, blank email, phone formatting,
      and normalized company names.
- [ ] Run the focused tests and confirm they fail because identity helpers do not exist.
- [ ] Implement pure normalization and duplicate-candidate helpers.
- [ ] Run the focused tests and confirm they pass.
- [ ] Add `Company`, contact-company relation, and normalized identity fields to Prisma.
- [ ] Write a staged SQL migration that creates companies, backfills distinct non-empty company
      names, links contacts, and preserves legacy company text.
- [ ] Apply the migration to a disposable local database and verify row counts before and after.
- [ ] Write failing validation tests for company create/update payloads.
- [ ] Implement company validation and authorized CRUD route handlers.
- [ ] Add duplicate warnings to contact create and CSV import without silently merging records.
- [ ] Add company list, detail, edit, and contact association UI.
- [ ] Add Companies navigation and relationship links from contact detail.
- [ ] Run focused tests, migration checks, full verification, and a browser smoke test.
- [ ] Record migration evidence and completion in project memory.

**Acceptance gate:** Existing company names survive migration; contacts can link to a company;
duplicate candidates are reported; no contact is silently dropped or merged.

---

## Milestone 2 — Tasks, activity capture, and My Work

**Deliverable:** Every important record can have an owner, due work, and a manually recorded outcome.

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_tasks/migration.sql`
- Create: `lib/domain/tasks/service.ts`
- Create: `lib/domain/tasks/queries.ts`
- Create: `lib/validations/tasks.ts`
- Create: `lib/validations/activities.ts`
- Create: `app/api/tasks/route.ts`
- Create: `app/api/tasks/[id]/route.ts`
- Create: `app/api/activities/route.ts`
- Create: `app/(dashboard)/work/page.tsx`
- Create: `components/tasks/TaskForm.tsx`
- Create: `components/tasks/TaskList.tsx`
- Create: `components/tasks/TaskStatusControl.tsx`
- Create: `components/contacts/ActivityComposer.tsx`
- Modify: `components/contacts/ActivityTimeline.tsx`
- Modify: `app/(dashboard)/contacts/[id]/page.tsx`
- Modify: `components/deals/DealDetail.tsx`
- Modify: `lib/constants.ts`
- Create: `tests/task-policy.test.ts`
- Create: `tests/task-state.test.ts`
- Create: `tests/activity-validation.test.ts`

- [ ] Define task status transitions and role policy in failing pure-domain tests.
- [ ] Confirm focused tests fail for the expected missing behavior.
- [ ] Add `Task`, `TaskStatus`, and `TaskPriority` schema with assignee, creator, due date, and optional
      contact, company, and deal links.
- [ ] Implement task policy and transition functions until focused tests pass.
- [ ] Implement authorized list/create/update/delete endpoints with pagination and filters.
- [ ] Implement activity creation for calls, emails, meetings, and notes with immutable history.
- [ ] Build `My Work` sections for overdue, today, upcoming, unassigned, and recently completed work.
- [ ] Add task and activity controls to contact, company, and deal detail pages.
- [ ] Add optimistic completion with rollback and an accessible error state.
- [ ] Verify members cannot mutate tasks outside the accepted role policy.
- [ ] Run focused tests, full verification, and keyboard/browser smoke tests.
- [ ] Record evidence and completion in project memory.

**Acceptance gate:** A member can see and complete assigned work; managers can reassign work; overdue
and upcoming tasks are accurate across time zones; every manual touchpoint appears in the timeline.

---

## Milestone 3 — Safe automation and workspace tick

**Deliverable:** Administrators and authorized managers can activate observable automation recipes
without arbitrary code or duplicate actions.

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_automation/migration.sql`
- Create: `lib/automation/types.ts`
- Create: `lib/automation/schemas.ts`
- Create: `lib/automation/conditions.ts`
- Create: `lib/automation/actions.ts`
- Create: `lib/automation/execute.ts`
- Create: `lib/automation/dispatch.ts`
- Create: `lib/automation/scheduled.ts`
- Create: `app/api/automations/route.ts`
- Create: `app/api/automations/[id]/route.ts`
- Create: `app/api/automations/[id]/runs/route.ts`
- Create: `app/api/cron/workspace-tick/route.ts`
- Create: `app/(dashboard)/automations/page.tsx`
- Create: `app/(dashboard)/automations/[id]/page.tsx`
- Create: `components/automations/AutomationForm.tsx`
- Create: `components/automations/AutomationRunList.tsx`
- Modify: contact, deal, inbox-link, task, and publishing mutation services to dispatch domain events.
- Modify: `vercel.json`
- Create: `tests/automation-schema.test.ts`
- Create: `tests/automation-conditions.test.ts`
- Create: `tests/automation-idempotency.test.ts`
- Create: `tests/automation-policy.test.ts`

- [ ] Write failing tests for every allowed trigger, condition operator, and action payload.
- [ ] Implement discriminated Zod schemas and reject unknown fields and action types.
- [ ] Write failing condition-evaluation tests including null, date, enum, and ownership cases.
- [ ] Implement deterministic condition evaluation until tests pass.
- [ ] Add rule and run models with a unique idempotency key and safe error metadata.
- [ ] Write failing execution tests proving a repeated event does not repeat its action.
- [ ] Implement transactional execution, action allowlisting, and run history.
- [ ] Add immediate dispatch for contact creation, deal stage changes, inbox linking, task completion,
      and failed publishing.
- [ ] Implement scheduled scans for overdue tasks, untouched leads, and approaching close dates.
- [ ] Replace the publishing-only cron entry with one workspace tick that invokes isolated processors
      and records partial failures without rerunning successful idempotent actions.
- [ ] Seed disabled default recipes for round-robin follow-up, stale-lead reminder, stage next-step,
      close-date reminder, won-deal onboarding, linked-inbox follow-up, and failed-post recovery.
- [ ] Add rule management and run-history UI with explicit activation confirmation.
- [ ] Run replay, authorization, failure, and schedule-boundary tests.
- [ ] Run full verification and record evidence.

**Acceptance gate:** Replaying the same event produces no duplicate task or notification; one failed
rule does not prevent other rules from running; every run has inspectable safe status and error data.

---

## Milestone 4 — Governance, invitations, and audit history

**Deliverable:** Team onboarding and consequential changes are secure and reviewable for a 50-person
workspace.

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_invitations_and_audit/migration.sql`
- Create: `lib/permissions.ts`
- Create: `lib/audit.ts`
- Create: `lib/invitations.ts`
- Create: `app/api/invitations/route.ts`
- Create: `app/api/invitations/[token]/accept/route.ts`
- Create: `app/(auth)/invite/[token]/page.tsx`
- Create: `app/(dashboard)/settings/audit/page.tsx`
- Modify: `app/api/team/route.ts`
- Modify: `components/team/InviteModal.tsx`
- Modify: all consequential mutation services to write audit events.
- Create: `tests/permissions.test.ts`
- Create: `tests/invitations.test.ts`
- Create: `tests/audit-redaction.test.ts`

- [ ] Centralize accepted role operations in pure permission tests and helpers.
- [ ] Add hashed, expiring, single-use invitations; never store raw tokens.
- [ ] Replace temporary-password display with invitation-link creation and later provider delivery.
- [ ] Add append-only audit events for assignments, roles, stage changes, automation, integrations,
      imports, and destructive actions.
- [ ] Prove audit serialization redacts password, token, secret, credential, and authorization fields.
- [ ] Add audit filtering by actor, entity, action, and date for administrators.
- [ ] Run authorization matrix, token replay, expiry, redaction, and full verification tests.
- [ ] Record evidence and completion in project memory.

**Acceptance gate:** Invitation tokens expire and cannot be replayed; permissions are consistent;
audit history reveals who changed important state without exposing secrets.

---

## Milestone 5 — Saved views, operating reports, and onboarding

**Deliverable:** Teams can adopt the CRM without custom RevOps configuration.

**Planned surfaces:**

- Saved contact, company, deal, and task filters.
- Default views: My Leads, Unowned Leads, No Touch in 7 Days, Overdue Work, Closing This Month.
- Manager workload, stage conversion, loss reasons, response SLA, and task completion reporting.
- First-run checklist for import, team, pipeline, first automation, and integration.
- CSV import preview with mapping, validation, duplicate warnings, and dry-run counts.

**Acceptance gate:** A new administrator can configure a usable workspace and assign the first work
without reading source code or editing database records.

---

## Milestone 6 — Communications integration

**Start condition:** ADR-P01 is accepted with a provider, and provider credentials plus redirect URIs
are available in a non-production test application.

**Planned scope:**

- OAuth connection with least-privilege scopes.
- Email and calendar metadata sync into relationship activity.
- User-controlled send/log behavior; no autonomous outbound communication.
- Cursor-based incremental sync, encrypted refresh tokens, provider backoff, and replay safety.
- Social inbox ingestion and replies only after each platform capability is verified.

**Acceptance gate:** Provider disconnect, token expiry, permission loss, retry, and duplicate delivery
are tested; no provider credential enters a client response or project log.

---

## Completion definition for every milestone

- Requirements and accepted decisions map to implemented tasks.
- Each new behavior has a test that was observed failing before implementation.
- Migrations were tested on a disposable database with rollback/recovery notes.
- Focused tests and the full verification suite pass freshly.
- Relevant browser paths were exercised with no console errors.
- Security-sensitive selections and logs were reviewed for secret exposure.
- Documentation, progress, worklog, and mistake records were updated.
- No feature is advertised in navigation or copy before its end-to-end path works.
