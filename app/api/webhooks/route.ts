// Webhook manager and generic receiver endpoint.
import { requireUser, authErrorResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { webhookSchema } from "@/lib/validations/settings";
import { jsonError } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await db.webhook.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return Response.json({ items });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = webhookSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    const item = await db.webhook.create({ data: { userId: user.id, ...parsed.data } });
    return Response.json(item, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
