# Contributing

1. Create a focused branch from `main`.
2. Copy `.env.example` to `.env.local` and use non-production credentials.
3. Run `npm ci`, `npm run db:generate`, and the required migration.
4. Before review, run `npm run format`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
5. Keep route authorization next to every database mutation. Never return complete `SocialAccount` records to the browser.
6. Include migration, environment, cron, and rollback notes in the pull request.

Never run the seed command against a remote database unless `ALLOW_DESTRUCTIVE_SEED=true` is deliberately set for that operation.
