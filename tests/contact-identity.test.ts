import assert from "node:assert/strict";
import test from "node:test";

type IdentityModule = {
  buildContactIdentityData?: (candidate: { email?: string | null; phone?: string | null }) => {
    email: string | null;
    emailNormalized: string | null;
    phone: string | null;
    phoneNormalized: string | null;
  };
  buildContactIdentityUpdateData?: (candidate: {
    email?: string | null;
    phone?: string | null;
  }) => Partial<{
    email: string | null;
    emailNormalized: string | null;
    phone: string | null;
    phoneNormalized: string | null;
  }>;
  findDuplicateCandidates?: (
    candidate: { email?: string | null; phone?: string | null },
    existing: Array<{
      id: string;
      emailNormalized?: string | null;
      phoneNormalized?: string | null;
    }>,
    excludeId?: string
  ) => Array<{ id: string; reasons: Array<"EMAIL" | "PHONE"> }>;
  normalizeCompanyKey?: (value?: string | null) => string | null;
  normalizeEmail?: (value?: string | null) => string | null;
  normalizePhone?: (value?: string | null) => string | null;
};

async function loadIdentityModule(): Promise<IdentityModule> {
  const modulePath = "../lib/domain/contacts/identity";
  return import(modulePath).catch(() => ({}));
}

test("normalizes contact email for identity matching", async () => {
  const { normalizeEmail } = await loadIdentityModule();

  assert.equal(typeof normalizeEmail, "function", "normalizeEmail is not implemented");
  assert.equal(normalizeEmail?.("  Founder@Example.COM "), "founder@example.com");
  assert.equal(normalizeEmail?.("\tFounder@Example.COM\r\n"), "founder@example.com");
  assert.equal(normalizeEmail?.(" ÄDA@Example.COM "), "Äda@example.com");
  assert.equal(normalizeEmail?.("   "), null);
  assert.equal(normalizeEmail?.(null), null);
  assert.equal(normalizeEmail?.(), null);
});

test("normalizes contact phone punctuation without inventing a country code", async () => {
  const { normalizePhone } = await loadIdentityModule();

  assert.equal(typeof normalizePhone, "function", "normalizePhone is not implemented");
  assert.equal(normalizePhone?.(" +91 (987) 654-3210 "), "+919876543210");
  assert.equal(normalizePhone?.("\t+91 (987) 654-3210\r\n"), "+919876543210");
  assert.equal(normalizePhone?.("987.654.3210"), "9876543210");
  assert.equal(normalizePhone?.("   "), null);
  assert.equal(normalizePhone?.(null), null);
});

test("normalizes company names into stable identity keys", async () => {
  const { normalizeCompanyKey } = await loadIdentityModule();

  assert.equal(typeof normalizeCompanyKey, "function", "normalizeCompanyKey is not implemented");
  assert.equal(normalizeCompanyKey?.("  ACME   Labs Pvt. Ltd. "), "acme labs pvt. ltd.");
  assert.equal(normalizeCompanyKey?.("\tACME\n Labs\r\n"), "acme labs");
  assert.equal(normalizeCompanyKey?.("ＡＣＭＥ"), "ＡＣＭＥ");
  assert.equal(normalizeCompanyKey?.("   "), null);
  assert.equal(normalizeCompanyKey?.(), null);
});

test("reports duplicate candidates with explicit identity reasons", async () => {
  const { findDuplicateCandidates } = await loadIdentityModule();

  assert.equal(
    typeof findDuplicateCandidates,
    "function",
    "findDuplicateCandidates is not implemented"
  );
  assert.deepEqual(
    findDuplicateCandidates?.({ email: " FOUNDER@example.com ", phone: "+91 (987) 654-3210" }, [
      {
        id: "same-both",
        emailNormalized: "founder@example.com",
        phoneNormalized: "+919876543210"
      },
      {
        id: "same-phone",
        emailNormalized: "other@example.com",
        phoneNormalized: "+919876543210"
      },
      { id: "different", emailNormalized: "different@example.com", phoneNormalized: "555" }
    ]),
    [
      { id: "same-both", reasons: ["EMAIL", "PHONE"] },
      { id: "same-phone", reasons: ["PHONE"] }
    ]
  );
});

test("ignores blank identities and the contact currently being edited", async () => {
  const { findDuplicateCandidates } = await loadIdentityModule();

  assert.equal(typeof findDuplicateCandidates, "function");
  assert.deepEqual(
    findDuplicateCandidates?.({ email: " ", phone: null }, [
      { id: "blank", emailNormalized: null, phoneNormalized: null }
    ]),
    []
  );
  assert.deepEqual(
    findDuplicateCandidates?.(
      { email: "owner@example.com" },
      [{ id: "current", emailNormalized: "owner@example.com", phoneNormalized: null }],
      "current"
    ),
    []
  );
});

test("builds clean display and normalized identity persistence fields", async () => {
  const { buildContactIdentityData } = await loadIdentityModule();

  assert.equal(
    typeof buildContactIdentityData,
    "function",
    "buildContactIdentityData is not implemented"
  );
  assert.deepEqual(
    buildContactIdentityData?.({
      email: " Founder@Example.COM ",
      phone: " +91 (987) 654-3210 "
    }),
    {
      email: "Founder@Example.COM",
      emailNormalized: "founder@example.com",
      phone: "+91 (987) 654-3210",
      phoneNormalized: "+919876543210"
    }
  );
  assert.deepEqual(buildContactIdentityData?.({ email: "", phone: " " }), {
    email: null,
    emailNormalized: null,
    phone: null,
    phoneNormalized: null
  });
});

test("updates only identity fields explicitly present in a patch", async () => {
  const { buildContactIdentityUpdateData } = await loadIdentityModule();

  assert.equal(
    typeof buildContactIdentityUpdateData,
    "function",
    "buildContactIdentityUpdateData is not implemented"
  );
  assert.deepEqual(buildContactIdentityUpdateData?.({ email: " New@Example.com " }), {
    email: "New@Example.com",
    emailNormalized: "new@example.com"
  });
  assert.deepEqual(buildContactIdentityUpdateData?.({ phone: "" }), {
    phone: null,
    phoneNormalized: null
  });
  assert.deepEqual(buildContactIdentityUpdateData?.({}), {});
});
