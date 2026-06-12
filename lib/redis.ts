/* eslint-disable no-console */
// Redis client singleton — safely no-ops if REDIS_URL is not configured.
import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redis__: Redis | null | undefined;
}

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn("[Redis] REDIS_URL not set — caching and pub/sub disabled.");
    return null;
  }
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    // Reconnect with exponential backoff, max 30 s.
    reconnectOnError: (err) => {
      console.error("[Redis] reconnectOnError:", err.message);
      return true;
    }
  });
  client.on("error", (err) => console.error("[Redis] error:", err.message));
  client.on("connect", () => console.log("[Redis] connected"));
  return client;
}

// Singleton — reuse across hot-reloads in development.
export const redis: Redis | null =
  globalThis.__redis__ ?? (globalThis.__redis__ = createRedisClient());
