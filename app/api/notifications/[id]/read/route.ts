// Mark a notification as read.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const notification = await db.notification.update({ where: { id, userId: user.id }, data: { isRead: true } });
    return Response.json(notification);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
