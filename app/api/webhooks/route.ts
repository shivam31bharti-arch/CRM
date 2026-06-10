// Webhook manager and generic receiver endpoint.
import { requireUser, authErrorResponse } from "@/lib/auth";
import { webhookSchema } from "@/lib/validations/settings";
import { jsonError } from "@/lib/utils";

const webhooks: Array<{ id: string; url: string; eventTypes: string[] }> = [];

export async function GET() {
  try {
    await requireUser();
    return Response.json({ items: webhooks });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser();
    const parsed = webhookSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    const item = { id: crypto.randomUUID(), ...parsed.data };
    webhooks.push(item);
    return Response.json(item, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
