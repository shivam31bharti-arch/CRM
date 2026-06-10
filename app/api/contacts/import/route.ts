// CSV contact import API with header validation and row error reporting.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const text = await request.text();
    const [headerLine, ...lines] = text.trim().split(/\r?\n/);
    const headers = headerLine?.split(",").map((h) => h.trim()) ?? [];
    const required = ["firstName", "lastName"];
    const missing = required.filter((name) => !headers.includes(name));
    if (missing.length) return Response.json({ errors: [`Missing headers: ${missing.join(", ")}`] }, { status: 422 });
    const errors: string[] = [];
    const created = [];
    for (const [index, line] of lines.entries()) {
      const values = line.split(",").map((v) => v.trim());
      const row = Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ""]));
      if (!row.firstName || !row.lastName) {
        errors.push(`Row ${index + 2}: firstName and lastName are required.`);
        continue;
      }
      created.push(
        await db.contact.create({
          data: {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email || null,
            company: row.company || null,
            createdById: user.id
          }
        })
      );
    }
    return Response.json({ created, errors });
  } catch (error) {
    return authErrorResponse(error);
  }
}
