// Inbox item detail API — read without side-effects, mark-read via PATCH.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/utils";

// [H-1] GET is now read-only and idempotent. Ownership checked via socialAccount.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const item = await db.inboxItem.findFirst({
      where: { id, socialAccount: { userId: user.id } },
      include: { contact: true, socialAccount: true }
    });
    if (!item) return jsonError("Inbox item not found.", 404);
    return Response.json(item);
  } catch (error) {
    return authErrorResponse(error);
  }
}

// [H-1] State mutation (mark read/unread) belongs in PATCH, with ownership guard.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = (await request.json()) as { isRead?: boolean };
    if (typeof body.isRead !== "boolean") return jsonError("isRead boolean is required.", 422);
    const existing = await db.inboxItem.findFirst({
      where: { id, socialAccount: { userId: user.id } }
    });
    if (!existing) return jsonError("Inbox item not found.", 404);
    const item = await db.inboxItem.update({ where: { id }, data: { isRead: body.isRead } });
    return Response.json(item);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
