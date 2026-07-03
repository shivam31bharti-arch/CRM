// Registration endpoint for new users.
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword, authErrorResponse } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";
import { jsonError } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    const users = await db.user.count();
    if (users > 0) {
      return jsonError(
        "Public registration is closed. Ask a workspace administrator for access.",
        403
      );
    }
    const email = parsed.data.email.toLowerCase();
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return jsonError("An account with this email already exists.", 409);
    const user = await db.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash: await hashPassword(parsed.data.password),
        role: Role.ADMIN,
        teamMemberships: { create: { role: Role.ADMIN } }
      },
      select: { id: true, email: true, name: true, role: true }
    });
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
