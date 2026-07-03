// CSV contact export API honoring current filters.
import { requireUser, authErrorResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/utils";

export async function GET() {
  try {
    await requireUser();
    const contacts = await db.contact.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        company: true,
        companyRecord: { select: { name: true } },
        status: true,
        createdAt: true
      }
    });
    const rows = contacts.map(({ companyRecord, ...contact }) => ({
      ...contact,
      company: companyRecord?.name ?? contact.company
    }));
    return new Response(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=contacts.csv"
      }
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
