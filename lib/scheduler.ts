// Core scheduler logic: find due posts and dispatch them to platform adapters.
// Called by the cron endpoint at /api/cron/publish-scheduled.
import { PostStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { decryptToken } from "@/lib/crypto";
import { publishPost } from "@/lib/social/publisher";
import { createNotification } from "@/lib/notifications";

export interface SchedulerResult {
  processed: number;
  succeeded: string[];
  failed: Array<{ id: string; error: string }>;
}

/**
 * Finds all posts whose scheduledAt is in the past and status is SCHEDULED,
 * then publishes each one via the appropriate platform adapter.
 * Runs atomically per-post — one failure does not block others.
 */
export async function runScheduler(): Promise<SchedulerResult> {
  const duePosts = await db.post.findMany({
    where: {
      status: PostStatus.SCHEDULED,
      scheduledAt: { lte: new Date() }
    },
    include: { socialAccount: true },
    orderBy: { scheduledAt: "asc" },
    // Safety cap — process at most 50 posts per cron run to avoid timeouts.
    take: 50
  });

  const result: SchedulerResult = {
    processed: duePosts.length,
    succeeded: [],
    failed: []
  };

  for (const post of duePosts) {
    try {
      // Decrypt the stored OAuth access token for this platform account.
      const accessToken = decryptToken(post.socialAccount.accessToken);
      const refreshToken = post.socialAccount.refreshToken
        ? decryptToken(post.socialAccount.refreshToken)
        : undefined;

      // Publish via the platform-specific adapter.
      const externalId = await publishPost({
        platform: post.platform,
        body: post.body,
        mediaUrls: post.mediaUrls,
        accessToken,
        refreshToken,
        accountId: post.socialAccount.accountId
      });

      // Mark published and record analytics seed.
      await db.post.update({
        where: { id: post.id },
        data: {
          status: PostStatus.PUBLISHED,
          publishedAt: new Date(),
          externalPostId: externalId,
          errorMessage: null,
          analytics: {
            create: { likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0, clicks: 0 }
          }
        }
      });

      // Notify the post author.
      await createNotification({
        userId: post.authorId,
        type: "POST_PUBLISHED",
        title: "Post published",
        body: `Your ${post.platform} post was published successfully.`,
        link: `/scheduler`
      });

      // If recurring, schedule the next occurrence.
      if (post.isRecurring && post.recurringRule) {
        const { nextRecurringDate } = await import("@/lib/validations/posts");
        const nextDate = nextRecurringDate(post.recurringRule, post.scheduledAt ?? new Date());
        await db.post.create({
          data: {
            body: post.body,
            mediaUrls: post.mediaUrls,
            platform: post.platform,
            status: PostStatus.SCHEDULED,
            scheduledAt: nextDate,
            isRecurring: post.isRecurring,
            recurringRule: post.recurringRule,
            authorId: post.authorId,
            socialAccountId: post.socialAccountId,
            campaignId: post.campaignId
          }
        });
      }

      result.succeeded.push(post.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`[Scheduler] Failed to publish post ${post.id}:`, errorMessage);

      // Mark post as FAILED and record the error.
      await db.post.update({
        where: { id: post.id },
        data: { status: PostStatus.FAILED, errorMessage }
      });

      // Notify the author about the failure.
      await createNotification({
        userId: post.authorId,
        type: "POST_FAILED",
        title: "Post failed to publish",
        body: `Your ${post.platform} post could not be published: ${errorMessage}`,
        link: `/scheduler`
      });

      result.failed.push({ id: post.id, error: errorMessage });
    }
  }

  return result;
}
