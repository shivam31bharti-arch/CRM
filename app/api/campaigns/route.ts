// Campaign collection API for list and create.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { campaignSchema } from "@/lib/validations/campaigns";
import { jsonError } from "@/lib/utils";

export async function GET() {
  try {
    await requireUser();
    const items = await db.campaign.findMany({
      include: { posts: true, contacts: { include: { contact: true } }, deals: { include: { deal: true } } },
      orderBy: { createdAt: "desc" }
    });
    return Response.json({ items });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser();
    const parsed = campaignSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    const campaign = await db.campaign.create({
      data: {
        ...parsed.data,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null
      }
    });
    return Response.json(campaign, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
