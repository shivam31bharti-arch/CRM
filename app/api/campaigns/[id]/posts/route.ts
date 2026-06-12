// Campaign post linking API.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { campaignLinkSchema } from "@/lib/validations/campaigns";
import { jsonError } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUser();
    const parsed = campaignLinkSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Post id is required.", 422);
    const post = await db.post.update({ where: { id: parsed.data.id }, data: { campaignId: id } });
    return Response.json(post);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireUser();
    const parsed = campaignLinkSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Post id is required.", 422);
    const post = await db.post.update({ where: { id: parsed.data.id }, data: { campaignId: null } });
    return Response.json(post);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
