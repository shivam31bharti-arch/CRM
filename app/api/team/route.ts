// Team API for listing and inviting members.
import { authErrorResponse, hashPassword, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { inviteSchema } from "@/lib/validations/team";
import { jsonError } from "@/lib/utils";

export async function GET() {
  try {
    await requireUser();
    const items = await db.teamMember.findMany({
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } },
      orderBy: { joinedAt: "desc" }
    });
    const activity = await db.activity.findMany({ include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 50 });
    return Response.json({ items, activity });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser(["ADMIN"]);
    const parsed = inviteSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    const user = await db.user.upsert({
      where: { email: parsed.data.email.toLowerCase() },
      update: { role: parsed.data.role },
      create: {
        email: parsed.data.email.toLowerCase(),
        name: parsed.data.name ?? parsed.data.email.split("@")[0],
        role: parsed.data.role,
        passwordHash: await hashPassword(`Invite${Date.now()}!`)
      }
    });
    const member = await db.teamMember.upsert({
      where: { id: user.id },
      update: { role: parsed.data.role },
      create: { id: user.id, userId: user.id, role: parsed.data.role }
    });
    return Response.json({ user: { id: user.id, email: user.email, role: user.role }, member }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
