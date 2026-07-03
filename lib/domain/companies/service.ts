import { normalizeCompanyKey } from "@/lib/domain/contacts/identity";

type CompanyInput = {
  name: string;
  website?: string;
  industry?: string;
  phone?: string;
  description?: string;
  ownerId?: string | null;
};

type CompanyActor = {
  id: string;
  role: "ADMIN" | "MANAGER" | "MEMBER";
};

function optionalValue(value?: string): string | null {
  return value || null;
}

export function buildCompanyData(input: CompanyInput, actor: CompanyActor) {
  return {
    name: input.name,
    normalizedName: normalizeCompanyKey(input.name)!,
    website: optionalValue(input.website),
    industry: optionalValue(input.industry),
    phone: optionalValue(input.phone),
    description: optionalValue(input.description),
    ownerId: actor.role === "MEMBER" ? actor.id : input.ownerId || actor.id
  };
}

export function buildCompanyUpdateData(input: Partial<CompanyInput>, actor: CompanyActor) {
  const data: Record<string, string | null> = {};
  if (input.name !== undefined) {
    data.name = input.name;
    data.normalizedName = normalizeCompanyKey(input.name)!;
  }
  for (const field of ["website", "industry", "phone", "description"] as const) {
    if (input[field] !== undefined) data[field] = optionalValue(input[field]);
  }
  if (Object.prototype.hasOwnProperty.call(input, "ownerId")) {
    data.ownerId = actor.role === "MEMBER" ? actor.id : input.ownerId || null;
  }
  return data;
}

export function canEditCompany(actor: CompanyActor, ownerId?: string | null): boolean {
  return actor.role !== "MEMBER" || ownerId === actor.id;
}

export function canArchiveCompany(role: CompanyActor["role"]): boolean {
  return role === "ADMIN" || role === "MANAGER";
}
