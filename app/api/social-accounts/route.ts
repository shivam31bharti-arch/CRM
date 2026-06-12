// Social account API for connected account listing and local demo creation.
import { Platform } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { encryptToken } from "@/lib/crypto";
import { jsonError } from "@/lib/utils";

// [H-5] Explicit select — never expose accessToken or refreshToken to the client.
const safeSelect = {
  id: true,
  platform: true,
  accountName: true,
  accountId: true,
  avatarUrl: true,
  followerCount: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  tokenExpiry: true
} as const;

export async function GET() {
  try {
    const user = await requireUser();
    const items = await db.socialAccount.findMany({
      where: { userId: user.id },
      select: safeSelect,
      orderBy: { createdAt: "desc" }
    });
    return Response.json({ items });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (process.env.NODE_ENV === "production") {
      return jsonError("Use the OAuth connect flow to add social accounts.", 410);
    }

    const body = (await request.json()) as { platform?: Platform; accountName?: string };
    if (!body.platform || !body.accountName) return jsonError("Platform and account name are required.", 422);

    // [C-2] Encrypt the access token before persisting to the database.
    const item = await db.socialAccount.create({
      data: {
        platform: body.platform,
        accountName: body.accountName,
        accountId: `${body.platform.toLowerCase()}_${Date.now()}`,
        accessToken: encryptToken("mock-access-token"),
        userId: user.id,
        followerCount: 1200
      },
      select: safeSelect
    });
    return Response.json(item, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
