import {
  buildContactIdentityData,
  type ContactDuplicateReason
} from "@/lib/domain/contacts/identity";

type ImportRow = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
};

type ExistingIdentity = {
  id: string;
  emailNormalized?: string | null;
  phoneNormalized?: string | null;
};

type IdentityMatch = {
  contactIds: string[];
  rowNumbers: number[];
};

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body exceeds the configured byte limit.");
    this.name = "RequestBodyTooLargeError";
  }
}

export async function readTextBodyWithLimit(
  body: ReadableStream<Uint8Array> | null,
  maximumBytes: number
): Promise<string> {
  if (!body) return "";
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > maximumBytes) {
        await reader.cancel();
        throw new RequestBodyTooLargeError();
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

function addMatch(
  map: Map<string, IdentityMatch>,
  identity: string | null | undefined,
  match: { contactId?: string; rowNumber?: number }
) {
  if (!identity) return;
  const current = map.get(identity) ?? { contactIds: [], rowNumbers: [] };
  if (match.contactId && !current.contactIds.includes(match.contactId)) {
    current.contactIds.push(match.contactId);
  }
  if (match.rowNumber && !current.rowNumbers.includes(match.rowNumber)) {
    current.rowNumbers.push(match.rowNumber);
  }
  map.set(identity, current);
}

export function prepareContactImportRows(rows: ImportRow[], existing: ExistingIdentity[]) {
  const emailMatches = new Map<string, IdentityMatch>();
  const phoneMatches = new Map<string, IdentityMatch>();
  for (const contact of existing) {
    addMatch(emailMatches, contact.emailNormalized, { contactId: contact.id });
    addMatch(phoneMatches, contact.phoneNormalized, { contactId: contact.id });
  }

  const accepted: Array<
    ImportRow & ReturnType<typeof buildContactIdentityData> & { company: string | null }
  > = [];
  const duplicates: Array<{
    rowNumber: number;
    reasons: ContactDuplicateReason[];
    matchingContactIds: string[];
    matchingRowNumbers: number[];
  }> = [];

  for (const row of rows) {
    const identity = buildContactIdentityData(row);
    const emailMatch = identity.emailNormalized
      ? emailMatches.get(identity.emailNormalized)
      : undefined;
    const phoneMatch = identity.phoneNormalized
      ? phoneMatches.get(identity.phoneNormalized)
      : undefined;
    const reasons: ContactDuplicateReason[] = [];
    if (emailMatch) reasons.push("EMAIL");
    if (phoneMatch) reasons.push("PHONE");

    if (reasons.length) {
      duplicates.push({
        rowNumber: row.rowNumber,
        reasons,
        matchingContactIds: [
          ...new Set([...(emailMatch?.contactIds ?? []), ...(phoneMatch?.contactIds ?? [])])
        ],
        matchingRowNumbers: [
          ...new Set([...(emailMatch?.rowNumbers ?? []), ...(phoneMatch?.rowNumbers ?? [])])
        ]
      });
      continue;
    }

    const acceptedRow = {
      ...row,
      ...identity,
      company: row.company?.trim() || null
    };
    accepted.push(acceptedRow);
    addMatch(emailMatches, identity.emailNormalized, { rowNumber: row.rowNumber });
    addMatch(phoneMatches, identity.phoneNormalized, { rowNumber: row.rowNumber });
  }

  return { accepted, duplicates };
}
