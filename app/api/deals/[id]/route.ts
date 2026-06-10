// Deal detail API for read, update, and delete.
import { DealStage } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dealSchema } from "@/lib/validations/deals";
import { jsonError } from "@/lib/utils";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const deal = await db.deal.findUnique({
      where: { id: params.id },
      include: {
        contact: true,
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        notes: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
        activities: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } }
      }
    });
    if (!deal) return jsonError("Deal not found.", 404);
    return Response.json(deal);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const parsed = dealSchema.partial().safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    if (parsed.data.stage === DealStage.CLOSED_LOST && !parsed.data.lostReason) {
      return jsonError("Lost reason is required when closing a deal as lost.", 422);
    }
    const deal = await db.deal.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        closeDate: parsed.data.closeDate ? new Date(parsed.data.closeDate) : undefined,
        wonAt: parsed.data.stage === DealStage.CLOSED_WON ? new Date() : undefined,
        lostAt: parsed.data.stage === DealStage.CLOSED_LOST ? new Date() : undefined
      }
    });
    return Response.json(deal);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser(["ADMIN", "MANAGER"]);
    await db.deal.delete({ where: { id: params.id } });
    return Response.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
