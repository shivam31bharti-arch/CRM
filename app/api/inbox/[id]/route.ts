// Inbox item detail API that marks messages read on open.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/utils";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const item = await db.inboxItem.update({
      where: { id: params.id },
      data: { isRead: true },
      include: { contact: true, socialAccount: true }
    });
    return Response.json(item);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const body = (await request.json()) as { isRead?: boolean };
    if (typeof body.isRead !== "boolean") return jsonError("isRead boolean is required.", 422);
    const item = await db.inboxItem.update({ where: { id: params.id }, data: { isRead: body.isRead } });
    return Response.json(item);
  } catch (error) {
    return authErrorResponse(error);
  }
}
