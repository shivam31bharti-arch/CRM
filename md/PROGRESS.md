# Current Progress

Last updated: 2026-07-03

## Current milestone

Milestone 1 â€” Companies and relationship data quality, with approved storage and Google Workspace
foundations brought forward because they unblock real operation.

## Current state

- First-class companies, normalized contact identities, duplicate-aware writes/imports, pagination,
  ownership controls, and company/contact editing are implemented.
- All six production migrations are applied on Supabase through
  `20260623090000_add_google_workspace`; all checked migrations are finished and none are rolled
  back.
- Supabase `anon` and `authenticated` roles have no `public` schema usage and zero accessible CRM
  tables. The application database owner has no default grants to those roles.
- The PostgreSQL 17 pre-deploy backup was restored successfully into a disposable PostgreSQL 17
  server before production migration.
- Private Supabase Storage media references, publish-time signed URLs, ownership checks, streaming
  multipart bounds, per-user quota guardrails, lifecycle cleanup, and platform-specific media
  validation are implemented.
- Google Workspace metadata/read-only integration is implemented and the schema migration is applied
  to Supabase. Live OAuth remains configuration-gated.
- The repository remains on branch `codex/startup-crm-operations` with the intentional pre-existing
  dirty working tree preserved.

## Confirmed by user

- Supabase Storage should use a private bucket and durable object references.
- Tested Prisma migrations may be applied to Supabase.
- Google Workspace is the first communications integration.

The remaining product-policy question is whether managers may author automation rules.

## Next smallest action

Configure deployment environment values for live provider operation:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `META_GRAPH_API_VERSION`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

Then create/confirm the private Supabase Storage bucket and run one live upload/delete/OAuth smoke
test.

## Working-tree warning

The repository contains many modified, deleted, and untracked files from the audit and current
implementation. They are intentional working state unless proven otherwise. Do not reset, checkout,
clean, or overwrite them.

## Blockers

- Live Supabase Storage upload/delete/publish testing requires server-side `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` configuration plus a private bucket.
- Live Google OAuth/synchronization requires a configured Google Cloud OAuth client and exact
  redirect URI. Credentials must be placed in local/deployment environment settings, not chat.


