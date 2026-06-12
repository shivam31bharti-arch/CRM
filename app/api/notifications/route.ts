// Notification API for current user list and creation.
import { z } from "zod";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { jsonError } from "@/lib/utils";

// [M-4] Strict schema — caps string lengths and restricts link to relative paths only.
const notificationInputSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  body: z.string().min(1).max(500).trim(),
  // Relative paths only — prevents javascript: and open-redirect attacks.
  link: z
    .string()
    .max(500)
    .regex(/^\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/, "link must be a relative path starting with /")
    .optional()
});

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
    const parsed = notificationInputSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);

    const notification = await createNotification({
      userId: user.id,
      type: "MENTION",
      title: parsed.data.title,
      body: parsed.data.body,
      link: parsed.data.link
    });
    return Response.json(notification, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
