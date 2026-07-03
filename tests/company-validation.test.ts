import assert from "node:assert/strict";
import test from "node:test";

type SchemaResult =
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: unknown };

type CompanyValidationModule = {
  companyQuerySchema?: {
    safeParse: (value: unknown) => SchemaResult;
  };
  companySchema?: {
    safeParse: (value: unknown) => SchemaResult;
  };
};

async function loadCompanyValidation(): Promise<CompanyValidationModule> {
  const modulePath = "../lib/validations/companies";
  return import(modulePath).catch(() => ({}));
}

test("accepts and trims a bounded company payload", async () => {
  const { companySchema } = await loadCompanyValidation();

  assert.ok(companySchema, "companySchema is not implemented");
  const result = companySchema.safeParse({
    name: "  Acme Labs  ",
    website: "https://acme.example",
    industry: "  Software  ",
    phone: " +91 98765 43210 ",
    description: "  Product studio  ",
    ownerId: null
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.data, {
      name: "Acme Labs",
      website: "https://acme.example",
      industry: "Software",
      phone: "+91 98765 43210",
      description: "Product studio",
      ownerId: null
    });
  }
});

test("rejects blank names, malformed URLs, oversized fields, and unknown input", async () => {
  const { companySchema } = await loadCompanyValidation();

  assert.ok(companySchema, "companySchema is not implemented");
  for (const payload of [
    { name: "   " },
    { name: "Acme", website: "not-a-url" },
    { name: "a".repeat(161) },
    { name: "Acme", description: "a".repeat(2001) },
    { name: "Acme", accessToken: "must-not-be-accepted" }
  ]) {
    assert.equal(companySchema.safeParse(payload).success, false, JSON.stringify(payload));
  }
});

test("allows empty optional form fields without treating them as URLs", async () => {
  const { companySchema } = await loadCompanyValidation();

  assert.ok(companySchema, "companySchema is not implemented");
  const result = companySchema.safeParse({
    name: "Acme",
    website: "",
    industry: "",
    phone: "",
    description: ""
  });
  assert.equal(result.success, true);
});

test("bounds and allowlists company list query parameters", async () => {
  const { companyQuerySchema } = await loadCompanyValidation();

  assert.ok(companyQuerySchema, "companyQuerySchema is not implemented");
  const defaults = companyQuerySchema.safeParse({});
  assert.equal(defaults.success, true);
  if (defaults.success) {
    assert.deepEqual(defaults.data, {
      page: 1,
      pageSize: 25,
      sort: "createdAt",
      direction: "desc"
    });
  }
  assert.equal(companyQuerySchema.safeParse({ pageSize: 101 }).success, false);
  assert.equal(companyQuerySchema.safeParse({ sort: "normalizedName" }).success, false);
  assert.equal(
    companyQuerySchema.safeParse({ sort: "name", direction: "asc", search: "acme" }).success,
    true
  );
});
