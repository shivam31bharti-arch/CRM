// Platform analytics trend endpoint.
import { Platform } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/utils";

export async function GET(_: Request, { params }: { params: Promise<{ platform: string }> }) {
  try {
    const { platform: platformParam } = await params;
    await requireUser();
    const platform = platformParam.toUpperCase() as Platform;
    if (!Object.values(Platform).includes(platform)) return jsonError("Unsupported platform.", 404);
    const items = await db.platformAnalytic.findMany({
      where: { socialAccount: { platform } },
      include: { socialAccount: true },
      orderBy: { recordedAt: "asc" }
    });
    return Response.json({ items });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
