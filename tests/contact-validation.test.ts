import assert from "node:assert/strict";
import test from "node:test";

type SchemaResult =
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: unknown };

type ContactValidationModule = {
  contactImportRowSchema?: { safeParse: (value: unknown) => SchemaResult };
  contactCreateSchema?: { safeParse: (value: unknown) => SchemaResult };
  contactSchema?: { safeParse: (value: unknown) => SchemaResult };
};

async function loadContactValidation(): Promise<ContactValidationModule> {
  return import("../lib/validations/contacts");
}

test("trims bounded contact input and accepts a company relation", async () => {
  const { contactSchema } = await loadContactValidation();

  assert.ok(contactSchema, "contactSchema is not implemented");
  const result = contactSchema.safeParse({
    firstName: "  Ada  ",
    lastName: "  Lovelace  ",
    email: "  Ada@Example.COM  ",
    phone: " +44 20 1234 5678 ",
    companyId: "company-1",
    status: "LEAD"
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.firstName, "Ada");
    assert.equal(result.data.lastName, "Lovelace");
    assert.equal(result.data.email, "Ada@Example.COM");
    assert.equal(result.data.phone, "+44 20 1234 5678");
    assert.equal(result.data.companyId, "company-1");
  }
});

test("rejects oversized and unknown contact fields", async () => {
  const { contactSchema } = await loadContactValidation();

  assert.ok(contactSchema, "contactSchema is not implemented");
  assert.equal(contactSchema.safeParse({ firstName: "", lastName: "Lovelace" }).success, false);
  assert.equal(
    contactSchema.safeParse({ firstName: "a".repeat(81), lastName: "Lovelace" }).success,
    false
  );
  assert.equal(
    contactSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      accessToken: "must-not-be-accepted"
    }).success,
    false
  );
});

test("requires an explicit boolean to override duplicate warnings", async () => {
  const { contactCreateSchema } = await loadContactValidation();

  assert.ok(contactCreateSchema, "contactCreateSchema is not implemented");
  const base = { firstName: "Ada", lastName: "Lovelace" };
  const defaults = contactCreateSchema.safeParse(base);
  assert.equal(defaults.success, true);
  if (defaults.success) assert.equal(defaults.data.allowDuplicate, false);
  const confirmed = contactCreateSchema.safeParse({ ...base, allowDuplicate: true });
  assert.equal(confirmed.success, true);
  if (confirmed.success) assert.equal(confirmed.data.allowDuplicate, true);
  assert.equal(contactCreateSchema.safeParse({ ...base, allowDuplicate: "yes" }).success, false);
});

test("applies normal contact field bounds to CSV import rows", async () => {
  const { contactImportRowSchema } = await loadContactValidation();

  assert.ok(contactImportRowSchema, "contactImportRowSchema is not implemented");
  assert.equal(
    contactImportRowSchema.safeParse({
      firstName: " Ada ",
      lastName: " Lovelace ",
      email: " ada@example.com ",
      company: " Analytical Engines "
    }).success,
    true
  );
  for (const payload of [
    { firstName: "a".repeat(81), lastName: "Lovelace" },
    { firstName: "Ada", lastName: "a".repeat(81) },
    { firstName: "Ada", lastName: "Lovelace", email: `${"a".repeat(310)}@example.com` },
    { firstName: "Ada", lastName: "Lovelace", company: "a".repeat(161) }
  ]) {
    assert.equal(contactImportRowSchema.safeParse(payload).success, false);
  }
});
