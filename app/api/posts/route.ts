// Social post collection API for scheduler list and create.
import { PostStatus } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { postSchema } from "@/lib/validations/posts";
import { jsonError } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const params = new URL(request.url).searchParams;
    const items = await db.post.findMany({
      where: {
        socialAccount: { userId: user.id },
        platform: params.get("platform") ? (params.get("platform") as never) : undefined,
        status: params.get("status") ? (params.get("status") as never) : undefined
      },
      include: { socialAccount: true, campaign: true, analytics: { orderBy: { recordedAt: "desc" }, take: 1 } },
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
    const account = await db.socialAccount.findFirst({
      where: { id: parsed.data.socialAccountId, userId: user.id, platform: parsed.data.platform }
    });
    if (!account) return jsonError("Social account is not available for this user and platform.", 403);
    const post = await db.post.create({
      data: {
        ...parsed.data,
        authorId: user.id,
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
        status: parsed.data.scheduledAt ? PostStatus.SCHEDULED : parsed.data.status,
        analytics: { create: { likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0, clicks: 0 } }
      }
    });
    return Response.json(post, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
