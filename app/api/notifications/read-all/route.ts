// Mark all notifications as read for the current user.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH() {
  try {
    const user = await requireUser();
    await db.notification.updateMany({ where: { userId: user.id }, data: { isRead: true } });
    return Response.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
