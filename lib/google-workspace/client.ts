import type { GoogleConnection } from "@prisma/client";
import { decryptToken, encryptToken } from "@/lib/crypto";
import { db } from "@/lib/db";
import {
  googleConfiguration,
  mergeGoogleTokenUpdate,
  safeGoogleSyncError,
  type GoogleTokenPayload
} from "@/lib/google-workspace/core";

export class GoogleApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

async function parseGoogleError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as {
    error?: { message?: string } | string;
    error_description?: string;
  } | null;
  if (typeof payload?.error === "string") return payload.error_description ?? payload.error;
  return payload?.error?.message ?? `Google API request failed (${response.status}).`;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenPayload> {
  const configuration = googleConfiguration();
  if (!configuration.configured)
    throw new GoogleApiError("Google Workspace is not configured.", 503);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      redirect_uri: configuration.redirectUri,
      grant_type: "authorization_code"
    }),
    cache: "no-store"
  });
  if (!response.ok) throw new GoogleApiError(await parseGoogleError(response), response.status);
  return (await response.json()) as GoogleTokenPayload;
}

async function refreshGoogleAccessToken(connection: GoogleConnection): Promise<string> {
  const configuration = googleConfiguration();
  if (!configuration.configured || !connection.refreshToken) {
    await db.googleConnection.update({
      where: { id: connection.id },
      data: {
        status: "REAUTH_REQUIRED",
        lastError: "Reconnect Google Workspace to continue syncing."
      }
    });
    throw new GoogleApiError("Google Workspace must be reconnected.", 401);
  }

  const existingRefreshToken = decryptToken(connection.refreshToken);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      refresh_token: existingRefreshToken,
      grant_type: "refresh_token"
    }),
    cache: "no-store"
  });
  if (!response.ok) {
    const message = await parseGoogleError(response);
    if (response.status === 400 || response.status === 401) {
      await db.googleConnection.update({
        where: { id: connection.id },
        data: {
          status: "REAUTH_REQUIRED",
          lastError: safeGoogleSyncError(new GoogleApiError(message, response.status))
        }
      });
    }
    throw new GoogleApiError(message, response.status);
  }

  const update = mergeGoogleTokenUpdate(
    existingRefreshToken,
    (await response.json()) as GoogleTokenPayload
  );
  await db.googleConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: encryptToken(update.accessToken),
      refreshToken: update.refreshToken
        ? encryptToken(update.refreshToken)
        : connection.refreshToken,
      tokenExpiry: new Date(Date.now() + update.expiresInSeconds * 1000),
      status: "CONNECTED",
      lastError: null
    }
  });
  return update.accessToken;
}

export async function getGoogleAccessToken(connection: GoogleConnection): Promise<string> {
  if (
    connection.status === "CONNECTED" &&
    (!connection.tokenExpiry || connection.tokenExpiry.getTime() > Date.now() + 60_000)
  ) {
    return decryptToken(connection.accessToken);
  }
  return refreshGoogleAccessToken(connection);
}

export async function googleApiJson<T>(
  accessToken: string,
  url: URL | string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...init?.headers },
    cache: "no-store"
  });
  if (!response.ok) throw new GoogleApiError(await parseGoogleError(response), response.status);
  return (await response.json()) as T;
}

export async function getGoogleAccountEmail(accessToken: string): Promise<string> {
  const profile = await googleApiJson<{ email?: string }>(
    accessToken,
    "https://openidconnect.googleapis.com/v1/userinfo"
  );
  if (!profile.email) throw new GoogleApiError("Google did not return an account email.", 502);
  return profile.email.trim().toLowerCase();
}

export async function revokeGooglePlainToken(token: string): Promise<void> {
  const response = await fetch("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
    cache: "no-store"
  });
  if (!response.ok && response.status !== 400) {
    throw new GoogleApiError(await parseGoogleError(response), response.status);
  }
}
