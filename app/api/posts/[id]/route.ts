// Social post detail API for read, update, cancel, and delete.
import { PostStatus } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { postPatchSchema } from "@/lib/validations/posts";
import { jsonError } from "@/lib/utils";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const post = await db.post.findFirst({
      where: { id: params.id, socialAccount: { userId: user.id } },
      include: { socialAccount: true, campaign: true }
    });
    if (!post) return jsonError("Post not found.", 404);
    return Response.json(post);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const existing = await db.post.findFirst({ where: { id: params.id, socialAccount: { userId: user.id } } });
    if (!existing) return jsonError("Post not found.", 404);
    if (body.status === PostStatus.CANCELLED) {
      const cancelled = await db.post.update({ where: { id: params.id }, data: { status: PostStatus.CANCELLED } });
      return Response.json(cancelled);
    }
    const parsed = postPatchSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    if (parsed.data.socialAccountId || parsed.data.platform) {
      const account = await db.socialAccount.findFirst({
        where: {
          id: parsed.data.socialAccountId ?? existing.socialAccountId,
          userId: user.id,
          platform: parsed.data.platform ?? existing.platform
        }
      });
      if (!account) return jsonError("Social account is not available for this user and platform.", 403);
    }
    const post = await db.post.update({
      where: { id: params.id },
      data: { ...parsed.data, scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined }
    });
    return Response.json(post);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const existing = await db.post.findFirst({ where: { id: params.id, socialAccount: { userId: user.id } } });
    if (!existing) return jsonError("Post not found.", 404);
    await db.post.delete({ where: { id: params.id } });
    return Response.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
