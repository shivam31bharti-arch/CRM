// Social post detail API for read, update, cancel, and delete.
import { PostStatus } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { postPatchSchema } from "@/lib/validations/posts";
import { safeSocialAccountSelect } from "@/lib/selects";
import { jsonError } from "@/lib/utils";
import { platformLimits } from "@/lib/constants";
import { mediaReferencesBelongToUser } from "@/lib/supabase-storage";
import { cleanupRemovedOwnedMedia, cleanupUnreferencedOwnedMedia } from "@/lib/media-cleanup";
import { validatePlatformMedia } from "@/lib/media-storage";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const post = await db.post.findFirst({
      where: { id, socialAccount: { userId: user.id } },
      include: { socialAccount: { select: safeSocialAccountSelect }, campaign: true }
    });
    if (!post) return jsonError("Post not found.", 404);
    return Response.json(post);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await request.json();
    const existing = await db.post.findFirst({ where: { id, socialAccount: { userId: user.id } } });
    if (!existing) return jsonError("Post not found.", 404);
    if (body.status === PostStatus.CANCELLED) {
      const cancelled = await db.post.update({
        where: { id },
        data: { status: PostStatus.CANCELLED }
      });
      return Response.json(cancelled);
    }
    const parsed = postPatchSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    if (parsed.data.mediaUrls && !mediaReferencesBelongToUser(user.id, parsed.data.mediaUrls)) {
      return jsonError("One or more uploaded media objects are not owned by this user.", 403);
    }
    const effectivePlatform = parsed.data.platform ?? existing.platform;
    const effectiveBody = parsed.data.body ?? existing.body;
    const effectiveMedia = parsed.data.mediaUrls ?? existing.mediaUrls;
    try {
      validatePlatformMedia(effectivePlatform, effectiveMedia);
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Unsupported media.", 422);
    }
    if (effectiveBody.length > platformLimits[effectivePlatform]) {
      return jsonError(
        `${effectivePlatform} posts must be ${platformLimits[effectivePlatform]} characters or fewer.`,
        422
      );
    }
    if (parsed.data.socialAccountId || parsed.data.platform) {
      const account = await db.socialAccount.findFirst({
        where: {
          id: parsed.data.socialAccountId ?? existing.socialAccountId,
          userId: user.id,
          platform: effectivePlatform,
          isActive: true
        }
      });
      if (!account)
        return jsonError("Social account is not available for this user and platform.", 403);
    }
    const post = await db.post.update({
      where: { id },
      data: {
        ...parsed.data,
        scheduledAt: parsed.data.scheduledAt
          ? new Date(parsed.data.scheduledAt)
          : parsed.data.scheduledAt === null
            ? null
            : undefined
      }
    });
    if (parsed.data.mediaUrls) {
      await cleanupRemovedOwnedMedia(user.id, existing.mediaUrls, post.mediaUrls);
    }
    return Response.json(post);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const existing = await db.post.findFirst({ where: { id, socialAccount: { userId: user.id } } });
    if (!existing) return jsonError("Post not found.", 404);
    await db.post.delete({ where: { id } });
    await cleanupUnreferencedOwnedMedia(user.id, existing.mediaUrls);
    return Response.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
