// Profile settings API for current user.
import { authErrorResponse, hashPassword, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/validations/settings";
import { jsonError } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    return Response.json({ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, role: user.role });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        avatarUrl: parsed.data.avatarUrl || null,
        passwordHash: parsed.data.password ? await hashPassword(parsed.data.password) : undefined
      },
      select: { id: true, name: true, email: true, avatarUrl: true, role: true }
    });
    return Response.json(updated);
  } catch (error) {
    return authErrorResponse(error);
  }
}
