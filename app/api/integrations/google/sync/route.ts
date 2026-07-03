import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoogleSyncBusyError, syncGoogleConnection } from "@/lib/google-workspace/sync";

export async function POST() {
  try {
    const user = await requireUser();
    const connection = await db.googleConnection.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });
    if (!connection)
      return Response.json({ error: "Connect Google Workspace first." }, { status: 404 });
    return Response.json(await syncGoogleConnection(connection.id, "MANUAL"));
  } catch (error) {
    if (error instanceof GoogleSyncBusyError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
