// Notification helper shared by routes that persist in-app notifications.
import type { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";

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
  return db.notification.create({ data: { userId, type, title, body, link } });
}
