// Team member role update and removal API.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { roleSchema } from "@/lib/validations/team";
import { jsonError } from "@/lib/utils";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireUser(["ADMIN"]);
    const parsed = roleSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Role is required.", 422);
    const existing = await db.teamMember.findUnique({ where: { id } });
    if (!existing) return jsonError("Team member not found.", 404);
    if (existing.userId === actor.id && parsed.data.role !== "ADMIN") {
      return jsonError("You cannot remove your own administrator access.", 409);
    }
    if (existing.role === "ADMIN" && parsed.data.role !== "ADMIN") {
      const adminCount = await db.teamMember.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return jsonError("The workspace must retain at least one administrator.", 409);
      }
    }
    const [member] = await db.$transaction([
      db.teamMember.update({ where: { id }, data: { role: parsed.data.role } }),
      db.user.update({ where: { id: existing.userId }, data: { role: parsed.data.role } })
    ]);
    return Response.json(member);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireUser(["ADMIN"]);
    const existing = await db.teamMember.findUnique({ where: { id } });
    if (!existing) return jsonError("Team member not found.", 404);
    if (existing.userId === actor.id) return jsonError("You cannot remove your own account.", 409);
    if (existing.role === "ADMIN") {
      const adminCount = await db.teamMember.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return jsonError("The workspace must retain at least one administrator.", 409);
      }
    }
    await db.$transaction([
      db.contact.updateMany({
        where: { assignedToId: existing.userId },
        data: { assignedToId: null }
      }),
      db.deal.updateMany({
        where: { assignedToId: existing.userId },
        data: { assignedToId: null }
      }),
      db.teamMember.delete({ where: { id } }),
      db.user.update({ where: { id: existing.userId }, data: { isActive: false } })
    ]);
    return Response.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
