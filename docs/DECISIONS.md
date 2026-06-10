# Decisions

- Chose a dense SaaS dashboard layout rather than a landing page because the requested product is an operational CRM.
- The local development app uses real Next.js route handlers, Prisma schema, and seeded PostgreSQL data. External services such as social publishing, Pusher, Resend, Uploadthing, and Stripe are represented by typed adapters/stubs so the app runs without production credentials.
- API routes enforce authentication through a shared helper. Admin-only mutating team operations enforce role checks.
- Research deliverables were written before application code to honor Phase 0.
- Auth uses a non-secret local fallback string only to prevent clean development/test runs from crashing when `.env.local` is not present. Real deployments must set `AUTH_SECRET` or `NEXTAUTH_SECRET`.
