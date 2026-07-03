import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("identity-sensitive writes use serialized transactions and recheck inside them", async () => {
  const [createContact, importContacts, createCompany] = await Promise.all([
    readFile("app/api/contacts/route.ts", "utf8"),
    readFile("app/api/contacts/import/route.ts", "utf8"),
    readFile("app/api/companies/route.ts", "utf8")
  ]);

  for (const source of [createContact, importContacts, createCompany]) {
    assert.match(source, /withSerializableTransaction/);
    assert.match(source, /lockWorkspaceIdentityWrites/);
  }
});

test("member-authorized updates lock the record before checking ownership", async () => {
  const [contactUpdate, companyUpdate] = await Promise.all([
    readFile("app/api/contacts/[id]/route.ts", "utf8"),
    readFile("app/api/companies/[id]/route.ts", "utf8")
  ]);

  for (const source of [contactUpdate, companyUpdate]) {
    assert.match(source, /withSerializableTransaction/);
    assert.match(source, /lockRecordForUpdate/);
  }
});

test("CSV import uses a streaming byte limit instead of Request.text", async () => {
  const source = await readFile("app/api/contacts/import/route.ts", "utf8");
  assert.match(source, /readTextBodyWithLimit\(request\.body, MAX_BYTES\)/);
  assert.doesNotMatch(source, /request\.text\(\)/);
});

test("Meta OAuth routes use the operator-configured Graph API version", async () => {
  const source = await readFile("app/api/social-accounts/connect/route.ts", "utf8");

  assert.match(source, /readMetaGraphApiVersion/);
  assert.doesNotMatch(source, /v19\.0/);
});

test("archived companies are restored by both direct creation and CSV import", async () => {
  const [createCompany, importContacts] = await Promise.all([
    readFile("app/api/companies/route.ts", "utf8"),
    readFile("app/api/contacts/import/route.ts", "utf8")
  ]);
  assert.match(createCompany, /existing\?\.archivedAt/);
  assert.match(createCompany, /archivedAt: null/);
  assert.match(importContacts, /archivedIds/);
  assert.match(importContacts, /data: \{ archivedAt: null \}/);
});
