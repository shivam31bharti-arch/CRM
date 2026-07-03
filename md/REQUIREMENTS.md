# CRM Product Requirements

Last reviewed: 2026-06-22

## Product outcome

Build a professional internal CRM for startup teams of 5–50 people that turns contacts, pipeline,
campaigns, and social conversations into owned, time-bound work. The product should reduce missed
follow-ups and operational ambiguity without recreating the administrative complexity of a large
enterprise CRM.

## Confirmed constraints

- One internal workspace; multi-tenant SaaS is outside the current scope.
- Credential authentication with `ADMIN`, `MANAGER`, and `MEMBER` roles.
- PostgreSQL through Prisma.
- Next.js App Router application deployed on Vercel.
- Vercel Hobby scheduling runs daily for now; production scheduling will run hourly.
- Social publishing, CRM records, campaigns, analytics snapshots, and team operations remain in one
  product.
- No API credential, OAuth token, password, or secret may be returned to the browser or written to a
  log.
- Existing uncommitted repository work must be preserved.

## Primary users

- Founder or administrator: configures the workspace, team, policies, and automation.
- Sales or growth manager: owns pipeline health, assignment, forecasts, and team workload.
- Team member: follows up with assigned contacts, completes tasks, records outcomes, and manages
  scheduled content or conversations.

## Essential workflows

1. Capture or import a person and associate them with a company.
2. Detect likely duplicates before creating another record.
3. Assign an owner and create a concrete next action with a due date.
4. Qualify a lead and move an opportunity through a controlled pipeline.
5. Record calls, emails, meetings, notes, and social interactions in one timeline.
6. Show each person a prioritized `My Work` queue.
7. Execute safe, observable automation when records change.
8. Run time-based reminders on the available schedule without duplicate execution.
9. Give managers workload, pipeline-risk, and response-SLA visibility.
10. Preserve an audit trail for sensitive or consequential changes.

## Quality requirements

- Mutations validate input with Zod and re-check authorization server-side.
- Multi-record state changes use Prisma transactions where atomicity matters.
- Scheduled and retried operations are idempotent.
- Automation uses an allowlist of typed triggers and actions; it cannot execute user-supplied code.
- Every background run records status, timestamps, and a safe error summary.
- UI includes useful loading, empty, error, and permission-denied states.
- Keyboard access, form labels, focus states, and semantic controls are required.
- New domain behavior follows red-green-refactor testing.
- The complete repository verification gate passes before a milestone is marked complete.

## Current product gaps

- Companies are stored as text on contacts instead of first-class records.
- Tasks, reminders, and a personal work queue do not exist.
- Activities can be displayed but users cannot intentionally log most touchpoints.
- Command-center recommendations are informative but do not create or complete work.
- There is no automation rule, execution, retry, or history model.
- Team onboarding uses a temporary password rather than an expiring invitation token.
- Role checks exist, but permissions are distributed across routes rather than expressed as one
  policy.
- Social inbox ingestion and replies depend on external platform access and are not active.

## Explicit non-goals for the first three milestones

- Billing and subscription management.
- Public API-key administration.
- Arbitrary outbound webhooks.
- User-authored JavaScript or code in automation rules.
- AI-generated lead scoring or autonomous outbound messages.
- Multi-workspace tenancy, territories, quotas, or complex approval chains.
- A general-purpose email marketing builder.
- Realtime infrastructure solely for visual novelty.

## Product decision gates

Implementation can begin with the recommended defaults below, but the user should confirm them
before integrations or permission behavior becomes difficult to reverse.

- Initial market: recommended default is B2B and service startups using social channels for demand.
- First communications integration: recommended default is Google Workspace before Microsoft 365.
- Automation authors: recommended default is administrators and managers; members can view runs that
  affect their records but cannot edit rules.
- Record visibility: recommended default is workspace-wide read access, with assignment-based member
  mutation rules and manager/admin override.
