// Immediate publish API — uses real platform adapters (not mock).
import { PostStatus } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptToken } from "@/lib/crypto";
import { publishPost } from "@/lib/social/publisher";
import { createNotification } from "@/lib/notifications";
import { jsonError } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { id } = (await request.json()) as { id?: string };
    if (!id) return jsonError("Post id is required.", 422);

    const existing = await db.post.findFirst({
      where: { id, socialAccount: { userId: user.id } },
      include: { socialAccount: true }
    });
    if (!existing) return jsonError("Post not found.", 404);

    // Prevent double-publishing.
    if (existing.status === PostStatus.PUBLISHED) {
      return jsonError("Post is already published.", 409);
    }

    try {
      // Decrypt OAuth credentials and call the real platform adapter.
      const accessToken = decryptToken(existing.socialAccount.accessToken);
      const refreshToken = existing.socialAccount.refreshToken
        ? decryptToken(existing.socialAccount.refreshToken)
        : undefined;

      const externalPostId = await publishPost({
        platform: existing.platform,
        body: existing.body,
        mediaUrls: existing.mediaUrls,
        accessToken,
        refreshToken,
        accountId: existing.socialAccount.accountId
      });

      const post = await db.post.update({
        where: { id },
        data: {
          status: PostStatus.PUBLISHED,
          publishedAt: new Date(),
          externalPostId,
          errorMessage: null,
          analytics: {
            create: { likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0, clicks: 0 }
          }
        }
      });

      await createNotification({
        userId: user.id,
        type: "POST_PUBLISHED",
        title: "Post published",
        body: `${post.platform} post was published successfully.`,
        link: `/scheduler`
      });

      return Response.json(post);
    } catch (publishError) {
      // If the platform API fails, mark the post as FAILED and notify.
      const errorMessage = publishError instanceof Error ? publishError.message : "Unknown publishing error";

      await db.post.update({
        where: { id },
        data: { status: PostStatus.FAILED, errorMessage }
      });

      await createNotification({
        userId: user.id,
        type: "POST_FAILED",
        title: "Post failed to publish",
        body: `${existing.platform} post could not be published: ${errorMessage}`,
        link: `/scheduler`
      });

      return jsonError(`Publishing failed: ${errorMessage}`, 502);
    }
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
