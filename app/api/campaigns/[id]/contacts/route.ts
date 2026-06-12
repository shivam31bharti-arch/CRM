// Campaign contact linking API.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { campaignLinkSchema } from "@/lib/validations/campaigns";
import { jsonError } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUser();
    const parsed = campaignLinkSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Contact id is required.", 422);
    const link = await db.campaignContact.upsert({
      where: { campaignId_contactId: { campaignId: id, contactId: parsed.data.id } },
      update: {},
      create: { campaignId: id, contactId: parsed.data.id }
    });
    return Response.json(link);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUser();
    const parsed = campaignLinkSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Contact id is required.", 422);
    await db.campaignContact.delete({ where: { campaignId_contactId: { campaignId: id, contactId: parsed.data.id } } });
    return Response.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
