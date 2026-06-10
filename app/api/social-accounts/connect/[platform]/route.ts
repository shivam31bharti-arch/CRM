// Mock OAuth connect flow that returns and stores a connected account.
import { Platform } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/utils";

export async function GET(_: Request, { params }: { params: { platform: string } }) {
  try {
    const user = await requireUser();
    const platform = params.platform.toUpperCase() as Platform;
    if (!Object.values(Platform).includes(platform)) return jsonError("Unsupported platform.", 404);
    const account = await db.socialAccount.upsert({
      where: { platform_accountId: { platform, accountId: `mock-${user.id}-${platform}` } },
      update: { isActive: true },
      create: {
        platform,
        accountId: `mock-${user.id}-${platform}`,
        accountName: `${platform[0]}${platform.slice(1).toLowerCase()} Brand`,
        accessToken: "mock-oauth-access-token",
        refreshToken: "mock-oauth-refresh-token",
        userId: user.id,
        followerCount: 2500
      }
    });
    return Response.json({ connected: true, account });
  } catch (error) {
    return authErrorResponse(error);
  }
}
