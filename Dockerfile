# Multi-stage Dockerfile for the Next.js CRM app.

# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get -o Acquire::Check-Date=false update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts
# Reinstall with dev deps for prisma generate
RUN npm install --ignore-scripts

# ── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get -o Acquire::Check-Date=false update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules

# [M-8] Explicit allowlist instead of COPY . .  — prevents .env.local or other
#        secret files from being baked into image layers.
COPY prisma ./prisma
COPY app ./app
COPY lib ./lib
COPY components ./components
COPY types ./types
COPY public ./public
COPY next.config.mjs tsconfig.json postcss.config.js tailwind.config.ts package.json ./

RUN npx prisma generate
RUN npm run build

# ── Stage 3: production runner ───────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get -o Acquire::Check-Date=false update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Only copy the build output and runtime files needed.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]
