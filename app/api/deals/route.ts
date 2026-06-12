// Deal collection API for list and create — with pagination.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dealSchema } from "@/lib/validations/deals";
import { jsonError } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    await requireUser();

    // [M-3] Paginate results to prevent full-table scans at scale.
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? 25)));
    const stage = params.get("stage") ?? undefined;

    const where = stage ? { stage: stage as never } : {};

    const [items, total] = await Promise.all([
      db.deal.findMany({
        where,
        include: { contact: true, assignedTo: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      db.deal.count({ where })
    ]);

    return Response.json({ items, total, page, pageSize });
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

export const dynamic = "force-dynamic";
