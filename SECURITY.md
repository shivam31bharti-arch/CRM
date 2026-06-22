# Security policy

Report vulnerabilities privately to the repository owner. Do not open a public issue containing credentials, customer data, OAuth tokens, exploit details, or production URLs.

Before deploying:

- generate unique `AUTH_SECRET`, `ENCRYPTION_KEY`, and `CRON_SECRET` values;
- apply Prisma migrations before starting the new release;
- restrict production registration to the administrator invite flow;
- configure rate limiting at the deployment firewall for authentication and mutation routes;
- rotate OAuth credentials immediately if encrypted token data or the encryption key may have been exposed.

Supported security fixes target the current `main` branch.

The latest repository audit summary is tracked in `SECURITY_AUDIT.md`.
