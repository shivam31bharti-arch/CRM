// Pipeline stage change API used by the drag-and-drop board.
import { DealStage } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { stageChangeSchema } from "@/lib/validations/deals";
import { jsonError } from "@/lib/utils";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const parsed = stageChangeSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    if (parsed.data.stage === DealStage.CLOSED_LOST && !parsed.data.lostReason) {
      return jsonError("Lost reason is required when marking a deal as lost.", 422);
    }
    const deal = await db.deal.update({
      where: { id: params.id },
      data: {
        stage: parsed.data.stage,
        wonAt: parsed.data.stage === DealStage.CLOSED_WON ? new Date() : null,
        lostAt: parsed.data.stage === DealStage.CLOSED_LOST ? new Date() : null,
        lostReason: parsed.data.lostReason,
        activities: {
          create: {
            type:
              parsed.data.stage === DealStage.CLOSED_WON
                ? "DEAL_WON"
                : parsed.data.stage === DealStage.CLOSED_LOST
                  ? "DEAL_LOST"
                  : "DEAL_STAGE_CHANGED",
            description: `Deal moved to ${parsed.data.stage}`,
            userId: user.id
          }
        }
      }
    });
    if (deal.assignedToId) {
      await createNotification({
        userId: deal.assignedToId,
        type: "DEAL_STAGE_CHANGED",
        title: "Deal stage changed",
        body: `${deal.title} moved to ${deal.stage}`,
        link: `/deals/${deal.id}`
      });
    }
    return Response.json(deal);
  } catch (error) {
    return authErrorResponse(error);
  }
}
