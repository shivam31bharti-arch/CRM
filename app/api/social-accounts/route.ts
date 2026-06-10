// Social account API for connected account listing and mock creation.
import { Platform } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await db.socialAccount.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return Response.json({ items });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as { platform?: Platform; accountName?: string };
    if (!body.platform || !body.accountName) return jsonError("Platform and account name are required.", 422);
    const item = await db.socialAccount.create({
      data: {
        platform: body.platform,
        accountName: body.accountName,
        accountId: `${body.platform.toLowerCase()}_${Date.now()}`,
        accessToken: "mock-access-token",
        userId: user.id,
        followerCount: 1200
      }
    });
    return Response.json(item, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
