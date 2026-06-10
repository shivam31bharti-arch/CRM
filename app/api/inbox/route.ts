// Unified inbox API for filtering and mark-all-read.
import { Prisma } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { inboxQuerySchema } from "@/lib/validations/inbox";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const parsed = inboxQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const where: Prisma.InboxItemWhereInput = {
      socialAccount: { userId: user.id },
      platform: parsed.platform,
      type: parsed.type,
      isRead: parsed.read ? parsed.read === "true" : undefined
    };
    const [items, unreadCount] = await Promise.all([
      db.inboxItem.findMany({
        where,
        include: { contact: true, socialAccount: true },
        orderBy: { receivedAt: "desc" },
        take: 100
      }),
      db.inboxItem.count({ where: { socialAccount: { userId: user.id }, isRead: false } })
    ]);
    return Response.json({ items, unreadCount });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH() {
  try {
    const user = await requireUser();
    await db.inboxItem.updateMany({ where: { socialAccount: { userId: user.id } }, data: { isRead: true } });
    return Response.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
