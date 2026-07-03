import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { isPublicAddress } from "../lib/safe-media";
import { safeSocialAccountSelect } from "../lib/selects";
import { csvEscape } from "../lib/utils";
import { nextRecurringDate } from "../lib/validations/posts";

async function findRouteFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = `${directory}/${entry.name}`;
      return entry.isDirectory()
        ? findRouteFiles(path)
        : Promise.resolve(entry.name === "route.ts" ? [path] : []);
    })
  );
  return nested.flat();
}

test("secret-bearing social account fields are excluded from browser selections", () => {
  assert.equal("accessToken" in safeSocialAccountSelect, false);
  assert.equal("refreshToken" in safeSocialAccountSelect, false);
});

test("database migrations deny Supabase Data API access to the CRM schema", async () => {
  const migration = await readFile(
    "prisma/migrations/20260623023000_harden_public_schema_access/migration.sql",
    "utf8"
  );

  assert.match(migration, /^BEGIN;/);
  assert.match(migration, /REVOKE USAGE, CREATE ON SCHEMA public FROM PUBLIC;/);
  assert.match(migration, /REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;/);
  assert.match(migration, /ALTER DEFAULT PRIVILEGES[\s\S]+REVOKE ALL ON TABLES/);
  assert.match(migration, /COMMIT;\s*$/);
});

test("client-facing routes do not include complete social account records", async () => {
  const routeFiles = [
    "app/api/posts/route.ts",
    "app/api/posts/[id]/route.ts",
    "app/api/inbox/route.ts",
    "app/api/inbox/[id]/route.ts",
    "app/api/analytics/posts/route.ts",
    "app/api/analytics/platform/[platform]/route.ts"
  ];
  for (const file of routeFiles) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(
      source,
      /socialAccount\s*:\s*true/,
      `${file} includes secret-bearing records`
    );
  }
});

test("all non-auth and non-cron API routes enforce application authentication", async () => {
  const routes = await findRouteFiles("app/api");
  const protectedRoutes = routes.filter(
    (file) => !file.includes("/api/auth/") && !file.includes("/api/cron/")
  );
  for (const file of protectedRoutes) {
    const source = await readFile(file, "utf8");
    assert.match(source, /requireUser/, `${file} has no application authorization guard`);
  }
});

test("private and loopback media destinations are blocked", () => {
  for (const address of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "::1", "fd00::1"]) {
    assert.equal(isPublicAddress(address), false, address);
  }
  assert.equal(isPublicAddress("1.1.1.1"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
});

test("recurring schedules always advance or reject", () => {
  const start = new Date("2026-06-21T00:00:00.000Z");
  assert.equal(nextRecurringDate("DAILY", start).toISOString(), "2026-06-22T00:00:00.000Z");
  assert.equal(nextRecurringDate("WEEKLY", start).toISOString(), "2026-06-28T00:00:00.000Z");
  assert.throws(() => nextRecurringDate("INVALID", start));
});

test("CSV export neutralizes spreadsheet formulas", () => {
  assert.equal(csvEscape("=1+1"), '"\'=1+1"');
  assert.equal(csvEscape("safe"), '"safe"');
});
