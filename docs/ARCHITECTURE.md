# Architecture

The application is a Next.js 14 App Router SaaS dashboard. Pages live under `app/(dashboard)` and share a sidebar/topbar shell. Authentication uses NextAuth credentials with hashed passwords and JWT sessions. API route handlers live under `app/api` and call Prisma through `lib/db.ts`.

Core server modules:

- `lib/auth.ts`: NextAuth config, password helpers, `requireUser`, and role checks.
- `lib/validations/*`: Zod schemas for forms and APIs.
- `lib/notifications.ts`: database notification creation and realtime fanout.
- `lib/pusher.ts`: Pusher adapter that no-ops without credentials.
- `prisma/schema.prisma`: schema-first data model.

External integrations are local-safe stubs for social publishing, Resend, Uploadthing, Pusher, and Stripe-ready billing until production credentials are provided.
