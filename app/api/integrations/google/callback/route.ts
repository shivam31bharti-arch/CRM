import { decryptToken, encryptToken } from "@/lib/crypto";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { exchangeGoogleCode, getGoogleAccountEmail } from "@/lib/google-workspace/client";
import {
  GOOGLE_SCOPES,
  googleConfiguration,
  hashOAuthState,
  mergeGoogleTokenUpdate
} from "@/lib/google-workspace/core";

function settingsRedirect(result: "connected" | "denied" | "invalid" | "failed") {
  const configuredRedirect = googleConfiguration().redirectUri;
  const origin = configuredRedirect ? new URL(configuredRedirect).origin : process.env.NEXTAUTH_URL;
  return new URL(`/settings/integrations?google=${result}`, origin ?? "http://localhost:3000");
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    if (url.searchParams.get("error")) return Response.redirect(settingsRedirect("denied"), 302);
    const state = url.searchParams.get("state");
    const code = url.searchParams.get("code");
    if (!state || !code) return Response.redirect(settingsRedirect("invalid"), 302);

    const stateHash = hashOAuthState(state);
    const attempt = await db.googleOAuthAttempt.findUnique({ where: { stateHash } });
    if (
      !attempt ||
      attempt.userId !== user.id ||
      attempt.usedAt ||
      attempt.expiresAt.getTime() <= Date.now()
    ) {
      return Response.redirect(settingsRedirect("invalid"), 302);
    }
    const consumed = await db.googleOAuthAttempt.updateMany({
      where: { id: attempt.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() }
    });
    if (!consumed.count) return Response.redirect(settingsRedirect("invalid"), 302);

    const existing = await db.googleConnection.findUnique({ where: { userId: user.id } });
    const existingRefreshToken = existing?.refreshToken
      ? decryptToken(existing.refreshToken)
      : null;
    const payload = await exchangeGoogleCode(code);
    const granted = new Set(payload.scope?.split(/\s+/).filter(Boolean) ?? GOOGLE_SCOPES);
    if (GOOGLE_SCOPES.some((scope) => !granted.has(scope))) {
      return Response.redirect(settingsRedirect("failed"), 302);
    }
    const tokens = mergeGoogleTokenUpdate(existingRefreshToken, payload);
    const email = await getGoogleAccountEmail(tokens.accessToken);
    const connection = await db.googleConnection.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        email,
        accessToken: encryptToken(tokens.accessToken),
        refreshToken: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
        tokenExpiry: new Date(Date.now() + tokens.expiresInSeconds * 1000),
        scopes: [...GOOGLE_SCOPES],
        status: "CONNECTED"
      },
      update: {
        email,
        accessToken: encryptToken(tokens.accessToken),
        refreshToken: tokens.refreshToken
          ? encryptToken(tokens.refreshToken)
          : existing?.refreshToken,
        tokenExpiry: new Date(Date.now() + tokens.expiresInSeconds * 1000),
        scopes: [...GOOGLE_SCOPES],
        status: "CONNECTED",
        lastError: null
      }
    });
    await db.googleOAuthAttempt.update({
      where: { id: attempt.id },
      data: { connectionId: connection.id }
    });
    return Response.redirect(settingsRedirect("connected"), 302);
  } catch (error) {
    console.error("[Google Workspace OAuth] Callback failed:", error);
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
