// CSV contact import API with header validation, size limits, and batch insert.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { lockWorkspaceIdentityWrites, withSerializableTransaction } from "@/lib/db-transaction";
import {
  normalizeCompanyKey,
  normalizeEmail,
  normalizePhone
} from "@/lib/domain/contacts/identity";
import {
  prepareContactImportRows,
  readTextBodyWithLimit,
  RequestBodyTooLargeError
} from "@/lib/domain/contacts/import";
import { contactImportRowSchema } from "@/lib/validations/contacts";
import { parse } from "csv-parse/sync";

// [C-3] Hard limits prevent memory exhaustion and DB connection flooding.
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ROWS = 5_000;

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    // [C-3] Validate Content-Type before reading body.
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("text/csv") && !contentType.includes("text/plain")) {
      return Response.json({ errors: ["Content-Type must be text/csv."] }, { status: 415 });
    }

    // [C-3] Enforce body size limit before loading into memory.
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BYTES) {
      return Response.json({ errors: [`File exceeds the 5 MB limit.`] }, { status: 413 });
    }

    let text: string;
    try {
      text = await readTextBodyWithLimit(request.body, MAX_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return Response.json({ errors: ["File exceeds the 5 MB limit."] }, { status: 413 });
      }
      throw error;
    }

    let rows: Array<Record<string, string>>;
    try {
      rows = parse(text, {
        bom: true,
        columns: (headers: string[]) => {
          const normalized = headers.map((header) => header.trim());
          const missing = ["firstName", "lastName"].filter((name) => !normalized.includes(name));
          if (missing.length) throw new Error(`Missing headers: ${missing.join(", ")}`);
          return normalized;
        },
        skip_empty_lines: true,
        trim: true,
        max_record_size: MAX_BYTES
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "CSV could not be parsed.";
      return Response.json({ errors: [message] }, { status: 422 });
    }

    if (rows.length > MAX_ROWS) {
      return Response.json(
        { errors: [`Import exceeds the ${MAX_ROWS.toLocaleString()} row limit.`] },
        { status: 422 }
      );
    }

    const errors: string[] = [];
    const validRows: Array<{
      rowNumber: number;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      company?: string;
    }> = [];

    for (const [index, row] of rows.entries()) {
      const parsedRow = contactImportRowSchema.safeParse(row);
      if (!parsedRow.success) {
        errors.push(
          `Row ${index + 2}: ${parsedRow.error.issues[0]?.message ?? "Invalid contact."}`
        );
        continue;
      }
      validRows.push({
        rowNumber: index + 2,
        firstName: parsedRow.data.firstName,
        lastName: parsedRow.data.lastName,
        email: parsedRow.data.email,
        phone: parsedRow.data.phone,
        company: parsedRow.data.company
      });
    }

    const emailIdentities = [
      ...new Set(validRows.map((row) => normalizeEmail(row.email)).filter(Boolean))
    ] as string[];
    const phoneIdentities = [
      ...new Set(validRows.map((row) => normalizePhone(row.phone)).filter(Boolean))
    ] as string[];
    const result = await withSerializableTransaction(async (transaction) => {
      await lockWorkspaceIdentityWrites(transaction);
      const existingIdentities =
        emailIdentities.length || phoneIdentities.length
          ? await transaction.contact.findMany({
              where: {
                status: { not: "ARCHIVED" },
                OR: [
                  ...(emailIdentities.length ? [{ emailNormalized: { in: emailIdentities } }] : []),
                  ...(phoneIdentities.length ? [{ phoneNormalized: { in: phoneIdentities } }] : [])
                ]
              },
              select: { id: true, emailNormalized: true, phoneNormalized: true }
            })
          : [];
      const prepared = prepareContactImportRows(validRows, existingIdentities);

      const companyNames = new Map<string, string>();
      for (const row of prepared.accepted) {
        const key = normalizeCompanyKey(row.company);
        if (key && row.company && !companyNames.has(key)) companyNames.set(key, row.company);
      }

      if (companyNames.size) {
        const keys = [...companyNames.keys()];
        const existingCompanies = await transaction.company.findMany({
          where: { normalizedName: { in: keys } },
          select: { id: true, normalizedName: true, archivedAt: true }
        });
        const archivedIds = existingCompanies
          .filter((company) => company.archivedAt !== null)
          .map((company) => company.id);
        if (archivedIds.length) {
          await transaction.company.updateMany({
            where: { id: { in: archivedIds } },
            data: { archivedAt: null }
          });
        }
        const existingKeys = new Set(existingCompanies.map((company) => company.normalizedName));
        const missingCompanies = [...companyNames]
          .filter(([normalizedName]) => !existingKeys.has(normalizedName))
          .map(([normalizedName, name]) => ({ name, normalizedName, ownerId: user.id }));
        if (missingCompanies.length) {
          await transaction.company.createMany({ data: missingCompanies, skipDuplicates: true });
        }
      }

      const companies = companyNames.size
        ? await transaction.company.findMany({
            where: { normalizedName: { in: [...companyNames.keys()] }, archivedAt: null },
            select: { id: true, normalizedName: true }
          })
        : [];
      const companyIdByKey = new Map(
        companies.map((company) => [company.normalizedName, company.id])
      );
      const batch = prepared.accepted.map(({ rowNumber: _, ...row }) => ({
        ...row,
        companyId: companyIdByKey.get(normalizeCompanyKey(row.company) ?? "") ?? null,
        createdById: user.id
      }));

      const created = batch.length
        ? (await transaction.contact.createMany({ data: batch, skipDuplicates: false })).count
        : 0;
      return { created, duplicates: prepared.duplicates };
    });

    return Response.json({ created: result.created, errors, duplicates: result.duplicates });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
