const ASCII_EDGE_WHITESPACE = /^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$/g;
const ASCII_WHITESPACE_RUN = /[ \t\n\r\f\v]+/g;

function trimAsciiWhitespace(value: string): string {
  return value.replace(ASCII_EDGE_WHITESPACE, "");
}

function foldAsciiCase(value: string): string {
  return value.replace(/[A-Z]/g, (character) => character.toLowerCase());
}

export function normalizeEmail(value?: string | null): string | null {
  const normalized = value ? foldAsciiCase(trimAsciiWhitespace(value)) : null;
  return normalized || null;
}

export function normalizePhone(value?: string | null): string | null {
  const trimmed = value ? trimAsciiWhitespace(value) : null;
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

export function normalizeCompanyKey(value?: string | null): string | null {
  // Keep this deliberately equivalent to the PostgreSQL backfill: trim, collapse whitespace,
  // then fold ASCII A-Z. Restricting case-folding to ASCII avoids collation-dependent differences
  // between JavaScript and PostgreSQL while preserving non-ASCII company names exactly.
  const normalized = value
    ? foldAsciiCase(trimAsciiWhitespace(value).replace(ASCII_WHITESPACE_RUN, " "))
    : null;
  return normalized || null;
}

export type ContactDuplicateReason = "EMAIL" | "PHONE";

type ContactIdentityCandidate = {
  email?: string | null;
  phone?: string | null;
};

type StoredContactIdentity = {
  id: string;
  emailNormalized?: string | null;
  phoneNormalized?: string | null;
};

export function buildContactIdentityData(candidate: ContactIdentityCandidate) {
  const email = candidate.email ? trimAsciiWhitespace(candidate.email) || null : null;
  const phone = candidate.phone ? trimAsciiWhitespace(candidate.phone) || null : null;
  return {
    email,
    emailNormalized: normalizeEmail(email),
    phone,
    phoneNormalized: normalizePhone(phone)
  };
}

export function buildContactIdentityUpdateData(candidate: ContactIdentityCandidate) {
  const data: Partial<ReturnType<typeof buildContactIdentityData>> = {};
  if (Object.prototype.hasOwnProperty.call(candidate, "email")) {
    const email = candidate.email ? trimAsciiWhitespace(candidate.email) || null : null;
    data.email = email;
    data.emailNormalized = normalizeEmail(email);
  }
  if (Object.prototype.hasOwnProperty.call(candidate, "phone")) {
    const phone = candidate.phone ? trimAsciiWhitespace(candidate.phone) || null : null;
    data.phone = phone;
    data.phoneNormalized = normalizePhone(phone);
  }
  return data;
}

export function findDuplicateCandidates(
  candidate: ContactIdentityCandidate,
  existing: StoredContactIdentity[],
  excludeId?: string
): Array<{ id: string; reasons: ContactDuplicateReason[] }> {
  const emailNormalized = normalizeEmail(candidate.email);
  const phoneNormalized = normalizePhone(candidate.phone);

  return existing.flatMap((contact) => {
    if (contact.id === excludeId) return [];
    const reasons: ContactDuplicateReason[] = [];
    if (emailNormalized && contact.emailNormalized === emailNormalized) reasons.push("EMAIL");
    if (phoneNormalized && contact.phoneNormalized === phoneNormalized) reasons.push("PHONE");
    return reasons.length ? [{ id: contact.id, reasons }] : [];
  });
}
