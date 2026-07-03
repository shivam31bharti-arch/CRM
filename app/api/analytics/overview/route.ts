// Analytics overview endpoint with aggregate KPI cards.
import { subDays } from "date-fns";
import { z } from "zod";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/utils";

// [M-1] Validate the from date before passing to Prisma — prevents Invalid Date crashes.
const dateParam = z.string().datetime({ offset: true }).optional();

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const params = new URL(request.url).searchParams;

    const fromParsed = dateParam.safeParse(params.get("from") ?? undefined);
    if (!fromParsed.success) return jsonError("Invalid 'from' date. Use ISO 8601 format.", 400);
    const from = fromParsed.data ? new Date(fromParsed.data) : subDays(new Date(), 30);

    const [totalPosts, analytics, followerSnapshots] = await Promise.all([
      db.post.count({ where: { authorId: user.id, createdAt: { gte: from } } }),
      db.postAnalytic.aggregate({
        where: { post: { authorId: user.id }, recordedAt: { gte: from } },
        _sum: { reach: true, likes: true, comments: true, shares: true, impressions: true }
      }),
      db.platformAnalytic.findMany({
        where: { socialAccount: { userId: user.id }, recordedAt: { gte: from } },
        select: { socialAccountId: true, followers: true, recordedAt: true },
        orderBy: { recordedAt: "asc" }
      })
    ]);

    const followerRanges = new Map<string, { first: number; latest: number }>();
    for (const snapshot of followerSnapshots) {
      const range = followerRanges.get(snapshot.socialAccountId);
      if (range) range.latest = snapshot.followers;
      else
        followerRanges.set(snapshot.socialAccountId, {
          first: snapshot.followers,
          latest: snapshot.followers
        });
    }
    const followerGrowth = [...followerRanges.values()].reduce(
      (sum, range) => sum + (range.latest - range.first),
      0
    );

    const engagementTotal =
      (analytics._sum.likes ?? 0) + (analytics._sum.comments ?? 0) + (analytics._sum.shares ?? 0);
    const impressions = analytics._sum.impressions ?? 1;
    return Response.json({
      totalPosts,
      totalReach: analytics._sum.reach ?? 0,
      avgEngagementRate: Math.round((engagementTotal / impressions) * 10000) / 100,
      followerGrowth
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
