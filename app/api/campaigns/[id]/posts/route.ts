// Campaign post linking API.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { campaignLinkSchema } from "@/lib/validations/campaigns";
import { jsonError } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const parsed = campaignLinkSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Post id is required.", 422);
    const owned = await db.post.findFirst({
      where: { id: parsed.data.id, socialAccount: { userId: user.id } },
      select: { id: true }
    });
    if (!owned) return jsonError("Post not found.", 404);
    const post = await db.post.update({ where: { id: owned.id }, data: { campaignId: id } });
    return Response.json(post);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const parsed = campaignLinkSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Post id is required.", 422);
    const owned = await db.post.findFirst({
      where: { id: parsed.data.id, socialAccount: { userId: user.id } },
      select: { id: true }
    });
    if (!owned) return jsonError("Post not found.", 404);
    const post = await db.post.update({ where: { id: owned.id }, data: { campaignId: null } });
    return Response.json(post);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
