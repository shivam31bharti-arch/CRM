import { authErrorResponse, requireUser } from "@/lib/auth";
import { decryptToken } from "@/lib/crypto";
import { db } from "@/lib/db";
import { revokeGooglePlainToken } from "@/lib/google-workspace/client";

export async function POST() {
  try {
    const user = await requireUser();
    const connection = await db.googleConnection.findUnique({ where: { userId: user.id } });
    if (!connection) return Response.json({ disconnected: true });
    const token = decryptToken(connection.refreshToken ?? connection.accessToken);
    await db.googleConnection.delete({ where: { id: connection.id } });
    await revokeGooglePlainToken(token).catch((error) => {
      console.error("[Google Workspace] Provider revocation failed after local disconnect:", error);
    });
    return Response.json({ disconnected: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
