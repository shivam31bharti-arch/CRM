// Inbox reply endpoint storing a local reply and timestamp.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { replySchema } from "@/lib/validations/inbox";
import { jsonError } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUser();
    const parsed = replySchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    const item = await db.inboxItem.update({
      where: { id },
      data: { isReplied: true, isRead: true, replyBody: parsed.data.replyBody, repliedAt: new Date() }
    });
    return Response.json(item);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
