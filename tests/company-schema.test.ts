import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "prisma/migrations/20260622230500_add_companies_and_contact_identity/migration.sql";

test("company schema keeps legacy contact company text during the staged migration", async () => {
  const schema = await readFile("prisma/schema.prisma", "utf8");

  assert.match(schema, /model Company\s*\{/);
  assert.match(schema, /normalizedName\s+String\s+@unique/);
  assert.match(schema, /archivedAt\s+DateTime\?/);
  assert.match(schema, /company\s+String\?/);
  assert.match(schema, /companyId\s+String\?/);
  assert.match(schema, /companyRecord\s+Company\?/);
  assert.match(schema, /emailNormalized\s+String\?/);
  assert.match(schema, /phoneNormalized\s+String\?/);
});

test("company migration backfills identities and links without deleting legacy text", async () => {
  const migration = await readFile(migrationPath, "utf8").catch(() => null);

  assert.ok(migration, "company migration is not implemented");
  assert.match(migration, /CREATE TABLE "Company"/);
  assert.match(migration, /INSERT INTO "Company"/);
  assert.match(migration, /UPDATE "Contact"/);
  assert.match(migration, /"emailNormalized"/);
  assert.match(migration, /"phoneNormalized"/);
  assert.match(migration, /"archivedAt" TIMESTAMP\(3\)/);
  assert.equal(
    migration.includes(`BTRIM(REGEXP_REPLACE("company", E'[ \\t\\n\\r\\f\\v]+', ' ', 'g'), ' ')`),
    true
  );
  assert.match(migration, /TRANSLATE\([\s\S]*'ABCDEFGHIJKLMNOPQRSTUVWXYZ'/);
  assert.doesNotMatch(migration, /LOWER\(REGEXP_REPLACE\(BTRIM\("company"\)/i);
  assert.doesNotMatch(migration, /NORMALIZE\(/i);
  assert.doesNotMatch(migration, /DROP COLUMN "company"/);
});
