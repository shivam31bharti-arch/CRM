// Notification helper shared by routes that need database and realtime fanout.
import type { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import { publishEvent } from "@/lib/pusher";

export async function createNotification({
  userId,
  type,
  title,
  body,
  link
}: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}) {
  const notification = await db.notification.create({ data: { userId, type, title, body, link } });
  await publishEvent(`private-user-${userId}`, "notification.created", { notification });
  return notification;
}
