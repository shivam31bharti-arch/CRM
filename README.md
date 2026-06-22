CRM

Internal CRM backbone for contact management, opportunity tracking, campaigns, social publishing, analytics, and team operations.

## Current scope

The application is a single internal workspace. The first `/register` submission creates the administrator; registration then closes and additional users must be added by an administrator from Team Operations.

Implemented today:

- credential authentication and role-aware workspace access;
- contacts, CSV import/export, deals, campaigns, activities, and notifications;
- encrypted social OAuth credentials and guarded publishing adapters;
- scheduled and recurring publishing with duplicate-delivery protection;
- analytics views backed by stored snapshots.

Not presented as active features yet: billing, public API keys, outbound webhooks, realtime subscriptions, social inbox replies, and automated analytics/inbox ingestion.

## Local setup

Requirements: Node.js 22+, npm, PostgreSQL, and optionally Docker.

```bash
npm ci
cp .env.example .env.local
npm run db:generate
npm run db:migrate
npm run dev
```

Open `http://localhost:3000/register` once to initialize the administrator account.

Docker:

```bash
docker compose up --build
```

## Environment

Generate secrets rather than reusing example values:

```bash
openssl rand -base64 32 # AUTH_SECRET and CRON_SECRET
openssl rand -hex 32    # ENCRYPTION_KEY
```

See `.env.example` for database and OAuth variables. OAuth access and refresh tokens are encrypted with AES-256-GCM and are never selected into browser-facing API responses.

## Scheduling

`vercel.json` intentionally uses one daily UTC publishing run for the current Vercel Hobby deployment. After upgrading the production plan, change the schedule to hourly:

```json
"schedule": "0 * * * *"
```

The cron endpoint requires `Authorization: Bearer $CRON_SECRET`. Scheduled times are queue eligibility times; delivery occurs on the next configured cron run.

## Database safety

Apply migrations in deployment with:

```bash
npm run db:migrate:deploy
```

The seed resets CRM data. It refuses remote databases unless `ALLOW_DESTRUCTIVE_SEED=true` is explicitly set.

## Quality checks

```bash
npm run format:check
npm run typecheck
npm run lint
npm test
npm run audit
npm run build
```

Security reporting and deployment requirements are documented in `SECURITY.md`.
The latest code audit summary is documented in `SECURITY_AUDIT.md`.
