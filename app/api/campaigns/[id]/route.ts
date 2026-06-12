// Campaign detail API for read, update, and delete.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { campaignSchema } from "@/lib/validations/campaigns";
import { jsonError } from "@/lib/utils";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUser();
    const campaign = await db.campaign.findUnique({
      where: { id },
      include: {
        posts: { include: { analytics: true } },
        contacts: { include: { contact: true } },
        deals: { include: { deal: true } }
      }
    });
    if (!campaign) return jsonError("Campaign not found.", 404);
    return Response.json(campaign);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUser();
    const parsed = campaignSchema.partial().safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    const campaign = await db.campaign.update({
      where: { id },
      data: {
        ...parsed.data,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined
      }
    });
    return Response.json(campaign);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUser(["ADMIN", "MANAGER"]);
    await db.campaign.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
