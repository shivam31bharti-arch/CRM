// Integration settings API for social account connection states.
import { Platform } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    const accounts = await db.socialAccount.findMany({ where: { userId: user.id } });
    return Response.json({
      platforms: Object.values(Platform).map((platform) => ({
        platform,
        account: accounts.find((account) => account.platform === platform) ?? null
      }))
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as { platform?: Platform; isActive?: boolean };
    if (!body.platform || typeof body.isActive !== "boolean") return jsonError("Platform and active state are required.", 422);
    const result = await db.socialAccount.updateMany({
      where: { userId: user.id, platform: body.platform },
      data: { isActive: body.isActive, accessToken: body.isActive ? undefined : "revoked" }
    });
    return Response.json({ updated: result.count });
  } catch (error) {
    return authErrorResponse(error);
  }
}
