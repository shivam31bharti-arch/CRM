import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { googleConfiguration } from "@/lib/google-workspace/core";

export async function GET() {
  try {
    const user = await requireUser();
    const connection = await db.googleConnection.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        email: true,
        status: true,
        scopes: true,
        lastSyncedAt: true,
        lastError: true,
        createdAt: true,
        _count: { select: { emailRecords: true, calendarEvents: true } }
      }
    });
    return Response.json({ configured: googleConfiguration().configured, connection });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
