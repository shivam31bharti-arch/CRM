// CSV contact import API with header validation, size limits, and batch insert.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

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

    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > MAX_BYTES) {
      return Response.json({ errors: ["File exceeds the 5 MB limit."] }, { status: 413 });
    }

    const [headerLine, ...lines] = text.trim().split(/\r?\n/);
    const headers = headerLine?.split(",").map((h) => h.trim()) ?? [];
    const required = ["firstName", "lastName"];
    const missing = required.filter((name) => !headers.includes(name));
    if (missing.length) return Response.json({ errors: [`Missing headers: ${missing.join(", ")}`] }, { status: 422 });

    // [C-3] Cap row count to prevent runaway imports.
    const dataLines = lines.slice(0, MAX_ROWS + 1);
    if (dataLines.length > MAX_ROWS) {
      return Response.json({ errors: [`Import exceeds the ${MAX_ROWS.toLocaleString()} row limit.`] }, { status: 422 });
    }

    const errors: string[] = [];
    const batch: Array<{ firstName: string; lastName: string; email: string | null; company: string | null; createdById: string }> = [];

    for (const [index, line] of dataLines.entries()) {
      if (!line.trim()) continue; // skip blank lines
      const values = line.split(",").map((v) => v.trim());
      const row = Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ""]));
      if (!row.firstName || !row.lastName) {
        errors.push(`Row ${index + 2}: firstName and lastName are required.`);
        continue;
      }
      batch.push({
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email || null,
        company: row.company || null,
        createdById: user.id
      });
    }

    // [C-3] Single createMany call instead of N sequential inserts.
    let created = 0;
    if (batch.length > 0) {
      const result = await db.contact.createMany({ data: batch, skipDuplicates: false });
      created = result.count;
    }

    return Response.json({ created, errors });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
