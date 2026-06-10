# Blockers

- `npm install` reports dependency audit warnings, including a Next.js 14 deprecation/security warning from npm. The build remains on Next.js 14 because the prompt explicitly requires Next.js 14 with App Router.
- Next.js 14 rejects `next.config.ts` at runtime. The repository uses `next.config.mjs` instead so lint/build can run.
- Docker validation could not be executed because `docker` is not installed or not available on PATH in this environment. The Dockerfile and compose file are present.
