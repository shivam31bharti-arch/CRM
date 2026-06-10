# Social Media Manager CRM

Full-stack CRM for sales contacts, deal pipeline, social scheduling, analytics, unified inbox, campaigns, team collaboration, integrations, and notifications.

## Quick Start

1. Copy `.env.example` to `.env.local`.
2. Run `npm install`.
3. Start Postgres with `docker compose up postgres redis`.
4. Run `npx prisma migrate dev --name init`.
5. Run `npm run db:seed`.
6. Start the app with `npm run dev`.

Demo login:

- Email: `admin@demo.com`
- Password: `Demo1234!`

## Docker

Run the full stack:

```bash
docker compose up --build
```

The app listens on `http://localhost:3000`.

## Validation

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Notes

Social publishing, email, uploads, Pusher, and billing are implemented as typed local-safe stubs unless production credentials are configured.
