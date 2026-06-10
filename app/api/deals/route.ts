// Deal collection API for list and create.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dealSchema } from "@/lib/validations/deals";
import { jsonError } from "@/lib/utils";

export async function GET() {
  try {
    await requireUser();
    const items = await db.deal.findMany({
      include: { contact: true, assignedTo: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { updatedAt: "desc" }
    });
    return Response.json({ items });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = dealSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    const deal = await db.deal.create({
      data: {
        ...parsed.data,
        closeDate: parsed.data.closeDate ? new Date(parsed.data.closeDate) : null,
        activities: { create: { type: "DEAL_CREATED", description: "Deal created", userId: user.id } }
      }
    });
    return Response.json(deal, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
