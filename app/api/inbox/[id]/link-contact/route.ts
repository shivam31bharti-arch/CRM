// Inbox contact-linking endpoint.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkContactSchema } from "@/lib/validations/inbox";
import { jsonError } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const parsed = linkContactSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Contact id is required.", 422);
    const item = await db.inboxItem.update({ where: { id: params.id }, data: { contactId: parsed.data.contactId } });
    return Response.json(item);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
