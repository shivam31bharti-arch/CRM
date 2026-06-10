# Product Gap Audit

Audit date: 2026-06-11  
Runtime audited: Docker Compose stack at `http://localhost:3000`

## Audit Summary

The product boots, authenticates seeded users, loads demo data, and supports core create flows for contacts, deals, scheduled posts, inbox replies, and campaigns. The audit found several important auth, authorization, and storage gaps that need to be fixed before treating this as production-ready.

## Findings

### P0 - Cross-user social account write is allowed

A member user could create a post using the admin user's `socialAccountId`; the API returned `201`. The post create route trusted the client-supplied social account id and did not verify that the selected social account belongs to the authenticated user.

Evidence:
- `app/api/posts/route.ts`
- Tested as `alex@demo.com` using an admin-owned social account id.

Risk:
- Users can publish or schedule content against accounts they do not own.
- Social tokens and account identity boundaries are not enforceable.

### P1 - Team role update API is broken

Admin role update returned `500`. The route treated `TeamMember.id` as if it were also `User.id`. Seeded team members created through nested Prisma writes have independent team member ids, so `db.user.update({ where: { id: params.id } })` fails.

Evidence:
- `app/api/team/[id]/route.ts`
- Docker logs showed Prisma `P2025` record-not-found errors.

Risk:
- Admins cannot reliably change roles or remove members.

### P1 - Unauthenticated API calls redirect to login

Unauthenticated API calls returned `307` redirects to `/login` rather than JSON `401` responses. Page redirects are correct for browser pages, but API consumers need status-code-first behavior.

Evidence:
- `GET /api/contacts` returned `307 /login?callbackUrl=%2Fapi%2Fcontacts`.
- `middleware.ts`

Risk:
- API clients, tests, and integrations receive HTML login flows instead of machine-readable auth errors.

### P1 - Auth fallback secret is unsafe outside local development

The auth config used a hardcoded fallback secret when `AUTH_SECRET` and `NEXTAUTH_SECRET` were missing.

Evidence:
- `lib/auth.ts`

Risk:
- A deployment missing secrets would still run with a known secret.

### P1 - Webhooks and API keys are not persisted

Webhooks were stored in a process-local array, and API keys were generated only in client state. Neither survives restart, and API keys are not hashed in the database.

Evidence:
- `app/api/webhooks/route.ts`
- `components/settings/ApiKeyManager.tsx`

Risk:
- Integration settings are lost.
- API key behavior is a UI stub, not a security feature.

### P2 - Social tokens are stored as plaintext

Social tokens are plain string columns.

Evidence:
- `prisma/schema.prisma`

Risk:
- Database compromise exposes OAuth tokens.

### P2 - Forms can silently fail

Several forms call `fetch`, reset state, and do not check `response.ok`.

Evidence:
- `components/contacts/ContactForm.tsx`

Risk:
- Users believe changes saved when validation, auth, or server errors occurred.

## Fix Log

### Fixed - Cross-user social account write

Implemented ownership checks in post list, create, update, delete, and publish routes. The API now verifies that the selected `socialAccountId` belongs to the authenticated user and matches the requested platform.

Validation:
- Retested as `alex@demo.com` with an admin-owned social account id.
- Result: `POST /api/posts` now returns `403`.

### Fixed - Team role update and member removal

Updated `app/api/team/[id]/route.ts` so it resolves the `TeamMember` first and then updates/unassigns by `teamMember.userId`, not by `teamMember.id`.

Validation:
- Retested as `admin@demo.com`.
- Result: `PATCH /api/team/[id]` now returns `200`.

### Fixed - API auth status behavior

Updated middleware so unauthenticated API requests receive JSON `401` responses while unauthenticated page requests still redirect to `/login`.

Validation:
- Retested unauthenticated `GET /api/contacts`.
- Result: `401 {"error":"Authentication required."}`.

### Fixed - Auth fallback secret handling

Restricted the hardcoded auth fallback secret to local development only. Production must provide `AUTH_SECRET` or `NEXTAUTH_SECRET`.

Validation:
- Docker compose provides `AUTH_SECRET` and `NEXTAUTH_SECRET`.
- Build and login continue to pass.

### Fixed - Webhook persistence

Added a `Webhook` Prisma model and rewired `GET/POST /api/webhooks` to persist webhooks by authenticated user instead of storing them in memory.

Validation:
- Created a webhook through the API.
- Result: `POST /api/webhooks` returned `201`, and `GET /api/webhooks` returned the saved record.

### Fixed - API key persistence and hashing

Added an `ApiKey` Prisma model and `GET/POST /api/settings/api-keys`. Generated keys are shown once; only a SHA-256 hash plus display prefix/last-four are stored. Updated the settings UI to list persisted keys.

Validation:
- Created an API key through the API.
- Result: `POST /api/settings/api-keys` returned `201`, and `GET /api/settings/api-keys` returned the saved metadata without the raw key.

### Improved - Professional UI/UX pass

Polished the dashboard shell with a darker navigation rail, softer page background, improved topbar, stronger page headers, refined card styling, elevated dashboard summary, and visible save feedback on contact/deal forms.

Validation:
- `npm run typecheck` passed.
- `npm run lint` passed with zero warnings.
- `npm test` passed.
- `npm run build` passed.
- Docker app rebuilt and restarted successfully.

## Remaining Gaps

### Remaining - Social token encryption

Social tokens are still stored as string columns. The next production-hardening pass should encrypt OAuth tokens at rest with an application-managed key or move token storage to a secrets manager.

### Remaining - Broader form feedback coverage

Contact and deal forms now show feedback, but some secondary forms still need consistent toast/error handling and disabled submitting states.
