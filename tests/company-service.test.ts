import assert from "node:assert/strict";
import test from "node:test";

type CompanyServiceModule = {
  buildCompanyData?: (
    value: {
      name: string;
      website?: string;
      industry?: string;
      phone?: string;
      description?: string;
      ownerId?: string | null;
    },
    actor: { id: string; role: "ADMIN" | "MANAGER" | "MEMBER" }
  ) => Record<string, unknown>;
  buildCompanyUpdateData?: (
    value: {
      name?: string;
      website?: string;
      industry?: string;
      phone?: string;
      description?: string;
      ownerId?: string | null;
    },
    actor: { id: string; role: "ADMIN" | "MANAGER" | "MEMBER" }
  ) => Record<string, unknown>;
  canArchiveCompany?: (role: "ADMIN" | "MANAGER" | "MEMBER") => boolean;
  canEditCompany?: (
    actor: { id: string; role: "ADMIN" | "MANAGER" | "MEMBER" },
    ownerId?: string | null
  ) => boolean;
};

async function loadCompanyService(): Promise<CompanyServiceModule> {
  const modulePath = "../lib/domain/companies/service";
  return import(modulePath).catch(() => ({}));
}

test("builds normalized nullable company persistence data", async () => {
  const { buildCompanyData } = await loadCompanyService();

  assert.equal(typeof buildCompanyData, "function", "buildCompanyData is not implemented");
  assert.deepEqual(
    buildCompanyData?.(
      {
        name: "Acme Labs",
        website: "",
        industry: "",
        phone: "+91 98765 43210",
        description: "",
        ownerId: null
      },
      { id: "manager-1", role: "MANAGER" }
    ),
    {
      name: "Acme Labs",
      normalizedName: "acme labs",
      website: null,
      industry: null,
      phone: "+91 98765 43210",
      description: null,
      ownerId: "manager-1"
    }
  );
});

test("prevents members from assigning a new company to another owner", async () => {
  const { buildCompanyData } = await loadCompanyService();

  assert.equal(typeof buildCompanyData, "function");
  assert.equal(
    buildCompanyData?.(
      { name: "Acme", ownerId: "someone-else" },
      { id: "member-1", role: "MEMBER" }
    ).ownerId,
    "member-1"
  );
});

test("allows managers and administrators to choose an owner id", async () => {
  const { buildCompanyData } = await loadCompanyService();

  assert.equal(typeof buildCompanyData, "function");
  assert.equal(
    buildCompanyData?.({ name: "Acme", ownerId: "member-2" }, { id: "admin-1", role: "ADMIN" })
      .ownerId,
    "member-2"
  );
});

test("allows members to edit only companies they own", async () => {
  const { canEditCompany } = await loadCompanyService();

  assert.equal(typeof canEditCompany, "function", "canEditCompany is not implemented");
  assert.equal(canEditCompany?.({ id: "member-1", role: "MEMBER" }, "member-1"), true);
  assert.equal(canEditCompany?.({ id: "member-1", role: "MEMBER" }, "member-2"), false);
  assert.equal(canEditCompany?.({ id: "member-1", role: "MEMBER" }, null), false);
  assert.equal(canEditCompany?.({ id: "manager-1", role: "MANAGER" }, "member-2"), true);
  assert.equal(canEditCompany?.({ id: "admin-1", role: "ADMIN" }, null), true);
});

test("restricts company archival to administrators and managers", async () => {
  const { canArchiveCompany } = await loadCompanyService();

  assert.equal(typeof canArchiveCompany, "function", "canArchiveCompany is not implemented");
  assert.equal(canArchiveCompany?.("ADMIN"), true);
  assert.equal(canArchiveCompany?.("MANAGER"), true);
  assert.equal(canArchiveCompany?.("MEMBER"), false);
});

test("builds partial company updates without overwriting omitted fields", async () => {
  const { buildCompanyUpdateData } = await loadCompanyService();

  assert.equal(
    typeof buildCompanyUpdateData,
    "function",
    "buildCompanyUpdateData is not implemented"
  );
  assert.deepEqual(
    buildCompanyUpdateData?.(
      { name: "Acme Group", ownerId: "someone-else" },
      { id: "member-1", role: "MEMBER" }
    ),
    { name: "Acme Group", normalizedName: "acme group", ownerId: "member-1" }
  );
  assert.deepEqual(buildCompanyUpdateData?.({ industry: "" }, { id: "admin-1", role: "ADMIN" }), {
    industry: null
  });
  assert.deepEqual(
    buildCompanyUpdateData?.({ phone: "+1 555" }, { id: "manager-1", role: "MANAGER" }),
    { phone: "+1 555" }
  );
});
