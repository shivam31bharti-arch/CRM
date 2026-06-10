// Notification API for current user list and creation helper endpoint.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const user = await requireUser();
    const [items, unreadCount] = await Promise.all([
      db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
      db.notification.count({ where: { userId: user.id, isRead: false } })
    ]);
    return Response.json({ items, unreadCount });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as { title?: string; body?: string; link?: string };
    const notification = await createNotification({
      userId: user.id,
      type: "MENTION",
      title: body.title ?? "Notification",
      body: body.body ?? "A new event needs attention.",
      link: body.link
    });
    return Response.json(notification, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
