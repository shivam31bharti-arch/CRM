// Mock immediate publish API for local development without social credentials.
import { PostStatus } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { jsonError } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { id } = (await request.json()) as { id?: string };
    if (!id) return jsonError("Post id is required.", 422);
    const post = await db.post.update({
      where: { id },
      data: {
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        externalPostId: `mock_${id}`,
        analytics: { create: { likes: 8, comments: 2, shares: 1, reach: 320, impressions: 520, clicks: 18 } }
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
  } catch (error) {
    return authErrorResponse(error);
  }
}
