# Blockers

- `npm install` reports dependency audit warnings, including a Next.js 14 deprecation/security warning from npm. The build remains on Next.js 14 because the prompt explicitly requires Next.js 14 with App Router.
- Next.js 14 rejects `next.config.ts` at runtime. The repository uses `next.config.mjs` instead so lint/build can run.
- Docker Desktop was installed with winget and the compose stack was validated on June 11, 2026. The Dockerfile was switched to Debian slim with OpenSSL for Prisma runtime compatibility.
