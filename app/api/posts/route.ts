// Social post collection API for scheduler list and create.
import { Platform, PostStatus } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { postSchema } from "@/lib/validations/posts";
import { safeSocialAccountSelect } from "@/lib/selects";
import { mediaReferencesBelongToUser } from "@/lib/supabase-storage";
import { jsonError } from "@/lib/utils";
import { validatePlatformMedia } from "@/lib/media-storage";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const params = new URL(request.url).searchParams;
    const platformParam = params.get("platform");
    const statusParam = params.get("status");
    const platform =
      platformParam && Object.values(Platform).includes(platformParam as Platform)
        ? (platformParam as Platform)
        : undefined;
    const status =
      statusParam && Object.values(PostStatus).includes(statusParam as PostStatus)
        ? (statusParam as PostStatus)
        : undefined;
    if (platformParam && !platform) return jsonError("Unsupported platform.", 422);
    if (statusParam && !status) return jsonError("Unsupported post status.", 422);
    const items = await db.post.findMany({
      where: {
        socialAccount: { userId: user.id },
        platform,
        status
      },
      include: {
        socialAccount: { select: safeSocialAccountSelect },
        campaign: true,
        analytics: { orderBy: { recordedAt: "desc" }, take: 1 }
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }]
    });
    return Response.json({ items });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    if (!mediaReferencesBelongToUser(user.id, parsed.data.mediaUrls)) {
      return jsonError("One or more uploaded media objects are not owned by this user.", 403);
    }
    try {
      validatePlatformMedia(parsed.data.platform, parsed.data.mediaUrls);
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Unsupported media.", 422);
    }
    const account = await db.socialAccount.findFirst({
      where: {
        id: parsed.data.socialAccountId,
        userId: user.id,
        platform: parsed.data.platform,
        isActive: true
      }
    });
    if (!account)
      return jsonError("Social account is not available for this user and platform.", 403);
    const post = await db.post.create({
      data: {
        ...parsed.data,
        authorId: user.id,
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
        status: parsed.data.scheduledAt ? PostStatus.SCHEDULED : parsed.data.status,
        analytics: {
          create: { likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0, clicks: 0 }
        }
      }
    });
    return Response.json(post, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
