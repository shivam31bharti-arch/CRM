# Decision Log

Decision states: `Accepted`, `Proposed`, `Superseded`.

## ADR-001 — Remain a single-workspace modular monolith

- Date: 2026-06-22
- State: Accepted
- Decision: Keep the current Next.js and PostgreSQL application as one deployable system with
  focused domain modules. Do not add multi-tenancy during the startup-operations milestones.
- Reason: The product is an internal backbone today. Workspace isolation would add migration,
  authorization, testing, and operational cost without serving a current user.
- Consequence: New tables do not require `workspaceId` yet. A future SaaS conversion requires a
  dedicated migration and threat model rather than piecemeal fields.

## ADR-002 — Separate immediate and scheduled automation

- Date: 2026-06-22
- State: Accepted
- Decision: Record-triggered automation executes from domain services immediately after successful
  mutations. Time-based scans run from one idempotent workspace tick.
- Reason: Most valuable automation does not require cron. This preserves useful behavior while the
  Vercel Hobby deployment is limited to a daily schedule.
- Consequence: The daily schedule can become hourly in production without changing rule semantics.

## ADR-003 — Use typed, allowlisted automation

- Date: 2026-06-22
- State: Accepted
- Decision: Store validated trigger, condition, and action definitions. Never evaluate user-supplied
  code or interpolate secrets into actions.
- Reason: A small team needs predictable recipes, observability, and safety more than an unrestricted
  workflow language.
- Consequence: Adding a new trigger or action requires schema, validation, execution, authorization,
  and test changes.

## ADR-004 — Introduce companies with a staged contact migration

- Date: 2026-06-22
- State: Accepted
- Decision: Add a first-class `Company` model and nullable `companyId`. Backfill existing non-empty
  company names, retain the legacy text field during one compatibility phase, then remove it in a
  separately verified migration.
- Reason: An immediate destructive replacement risks data loss and makes rollback harder.
- Consequence: API and UI code temporarily reads the relation first and falls back to legacy text.

## ADR-005 — Treat tasks as the unit of execution

- Date: 2026-06-22
- State: Accepted
- Decision: Recommendations and automation produce tasks or notifications; they do not silently act
  as completed human work.
- Reason: Owned tasks with deadlines make accountability visible and auditable for teams up to 50.
- Consequence: `My Work` becomes the default operational surface after the task milestone.

## ADR-006 — Use external skills as reviewable process guidance

- Date: 2026-06-22
- State: Accepted
- Decision: Adopt selected MIT-licensed Superpowers skills for planning, execution, TDD, debugging,
  and completion verification. Do not copy runtime dependencies or grant external instructions
  authority over repository rules.
- Reason: The repository benefits from repeatable engineering discipline, while blindly importing an
  agent framework would broaden behavior and risk conflicts.
- Consequence: The selected skill and source snapshot are recorded in `RESEARCH.md`.

## ADR-007 — Require evidence before completion labels

- Date: 2026-06-22
- State: Accepted
- Decision: A checkbox, milestone, fix, or feature may be called complete only with fresh evidence
  specified in `VERIFICATION.md`.
- Reason: Chat statements and code diffs are not proof of correct behavior.
- Consequence: Incomplete verification is reported as incomplete work, even if implementation exists.

## ADR-008 — Store owned media privately and sign only at publish time

- Date: 2026-06-23
- State: Accepted
- Decision: Upload owned media to a private Supabase Storage bucket, persist durable object
  references, and create short-lived signed URLs immediately before provider publication. Retain
  validated HTTPS URLs for legacy/external compatibility.
- Reason: Stored public or expiring URLs either expose media indefinitely or break scheduled posts.
- Consequence: The service-role key remains server-only; every storage reference is user-scoped;
  provider compatibility, lifecycle cleanup, and quotas are production gates.

## ADR-009 — Google Workspace is the first communications integration

- Date: 2026-06-23
- State: Accepted
- Decision: Implement one Google account per CRM user with Gmail metadata only and read-only events
  from the user's primary owned calendar.
- Reason: Email/calendar context is high-value CRM data, while least-privilege metadata avoids storing
  message bodies, attachments, calendar descriptions, and autonomous outbound capability.
- Consequence: Public external use of the restricted Gmail metadata scope may require Google OAuth
  verification and a security assessment.

## ADR-010 — Keep CRM tables outside the Supabase Data API

- Date: 2026-06-23
- State: Accepted
- Decision: CRM tables are accessed through authenticated server routes and Prisma only. Supabase
  `anon` and `authenticated` roles have no effective access to the `public` schema or its tables.
- Reason: The application already centralizes authorization server-side; a second direct data path
  would bypass those policies and increase accidental-exposure risk.
- Consequence: Any future client-direct Supabase feature requires a separate reviewed schema and RLS
  design instead of granting these roles broad `public` access.

## Proposed decisions awaiting confirmation

### ADR-P02 — Managers may author automation

- State: Proposed
- Recommended decision: `ADMIN` and `MANAGER` may create and edit automation rules; `MEMBER` is
  read-only for relevant run history.
- Confirmation needed: Whether managers should have configuration authority.
