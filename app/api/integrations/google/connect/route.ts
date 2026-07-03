import { randomBytes } from "crypto";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  buildGoogleAuthorizationUrl,
  googleConfiguration,
  hashOAuthState
} from "@/lib/google-workspace/core";

export async function GET() {
  try {
    const user = await requireUser();
    const configuration = googleConfiguration();
    if (!configuration.configured) {
      return Response.json({ error: "Google Workspace is not configured." }, { status: 503 });
    }
    const state = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 10 * 60_000);
    await db.$transaction([
      db.googleOAuthAttempt.deleteMany({
        where: {
          userId: user.id,
          OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }]
        }
      }),
      db.googleOAuthAttempt.create({
        data: { userId: user.id, stateHash: hashOAuthState(state), expiresAt }
      })
    ]);
    return Response.redirect(buildGoogleAuthorizationUrl(configuration, state), 302);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
