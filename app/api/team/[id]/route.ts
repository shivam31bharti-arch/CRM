// Team member role update and removal API.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { roleSchema } from "@/lib/validations/team";
import { jsonError } from "@/lib/utils";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser(["ADMIN"]);
    const parsed = roleSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Role is required.", 422);
    const [member] = await db.$transaction([
      db.teamMember.update({ where: { id: params.id }, data: { role: parsed.data.role } }),
      db.user.update({ where: { id: params.id }, data: { role: parsed.data.role } })
    ]);
    return Response.json(member);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser(["ADMIN"]);
    await db.$transaction([
      db.contact.updateMany({ where: { assignedToId: params.id }, data: { assignedToId: null } }),
      db.deal.updateMany({ where: { assignedToId: params.id }, data: { assignedToId: null } }),
      db.teamMember.delete({ where: { id: params.id } })
    ]);
    return Response.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
