# CRM Security Audit

Audit date: 2026-06-22

Scope reviewed:

- authentication and first-user bootstrap flow
- OAuth credential handling
- server-side API authorization guards
- external media fetching
- dependency and secret exposure checks

## Checks Run

- `npm test` -> `6 passed`
- `npm run audit` -> `found 0 vulnerabilities`
- tracked-source secret scan -> no live credentials detected

## Positive Controls Observed

- `AUTH_SECRET` is required at startup and does not silently fall back to a hardcoded default.
- OAuth access and refresh tokens are encrypted at rest with AES-256-GCM.
- Client-facing social account responses use a safe select that excludes token fields.
- Server-side media fetching rejects private and loopback destinations and enforces HTTPS plus file-size limits.
- Non-auth and non-cron API routes are covered by a test that asserts application authorization guards are present.

## Findings

### 1. First-user bootstrap can create the administrator account without a separate setup secret

Severity: Medium

File: `app/api/auth/register/route.ts`

The current design allows the first successful public `/register` submission to become the administrator. That is acceptable for intentional first-run setup, but it also means a freshly deployed instance can be claimed by anyone who reaches it first before the owner completes setup.

Recommended follow-up:

- require a one-time setup token or installation secret for first-user bootstrap, or
- disable public registration entirely outside an explicit setup mode.

### 2. Authentication hardening depends on external rate limiting rather than app-layer controls

Severity: Medium

Files:

- `lib/auth.ts`
- `app/api/auth/register/route.ts`
- `SECURITY.md`

Credential login and bootstrap registration do not currently enforce app-layer throttling, lockout, or attempt backoff. The security guidance correctly tells deployers to configure firewall rate limiting, but the app itself does not enforce this if deployed without edge controls.

Recommended follow-up:

- add app-layer rate limiting for login and registration routes, and
- add alerting or lockout behavior for repeated failed authentication attempts.

### 3. OAuth redirect base URL falls back to the request origin when `NEXTAUTH_URL` is missing

Severity: Low

Files:

- `lib/auth.ts`
- `app/api/social-accounts/connect/route.ts`

The app uses `trustHost: true` and the OAuth flow derives `baseUrl` from `process.env.NEXTAUTH_URL ?? url.origin`. In a misconfigured deployment behind an untrusted or incorrectly forwarded host header, that can produce incorrect callback or redirect origins.

Recommended follow-up:

- require `NEXTAUTH_URL` in production, and
- use `trustHost: true` only behind a trusted proxy configuration.

## Public Release Recommendation

Safe to make public as source code, with two conditions:

1. keep real secrets out of tracked files and continue using placeholder-only env examples
2. treat the bootstrap and rate-limiting findings as pre-production hardening work before exposing a live internet deployment
