import { createHash, timingSafeEqual } from "crypto";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.metadata",
  "https://www.googleapis.com/auth/calendar.events.owned.readonly"
] as const;

type GoogleEnvironment = Record<string, string | undefined>;

export function googleConfiguration(environment: GoogleEnvironment = process.env) {
  const clientId = environment.GOOGLE_CLIENT_ID?.trim() ?? "";
  const clientSecret = environment.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  const redirectUri = environment.GOOGLE_REDIRECT_URI?.trim() ?? "";

  return {
    configured: Boolean(clientId && clientSecret && redirectUri),
    clientId,
    clientSecret,
    redirectUri
  };
}

type GoogleConfiguration = ReturnType<typeof googleConfiguration>;

export function buildGoogleAuthorizationUrl(
  configuration: GoogleConfiguration,
  state: string
): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", configuration.clientId);
  url.searchParams.set("redirect_uri", configuration.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

export type GoogleTokenPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

export function mergeGoogleTokenUpdate(
  existingRefreshToken: string | null,
  payload: GoogleTokenPayload
) {
  if (!payload.access_token) throw new Error("Google did not return an access token.");
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? existingRefreshToken,
    expiresInSeconds: payload.expires_in ?? 3600
  };
}

export function hashOAuthState(state: string): string {
  return createHash("sha256").update(state, "utf8").digest("hex");
}

export function verifyOAuthState(state: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashOAuthState(state), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function normalizeGoogleEmail(value: string): string {
  return value.trim().replace(/[A-Z]/g, (character) => character.toLowerCase());
}

export function singleMatchedContactId(matches: Array<{ id: string }>): string | null {
  return matches.length === 1 ? matches[0].id : null;
}

export function safeGoogleSyncError(error: unknown): string {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status?: unknown }).status)
      : null;
  return status === 400 || status === 401
    ? "Google authorization expired. Reconnect Google Workspace."
    : "Google Workspace sync failed. Try again or reconnect the account.";
}

function splitAddressHeader(value: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let quoted = false;
  let angleDepth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '"' && value[index - 1] !== "\\") quoted = !quoted;
    if (!quoted && character === "<") angleDepth += 1;
    if (!quoted && character === ">") angleDepth = Math.max(0, angleDepth - 1);
    if (!quoted && angleDepth === 0 && character === ",") {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

export function parseGoogleAddressHeader(value?: string | null) {
  if (!value) return [];
  return splitAddressHeader(value).flatMap((raw) => {
    const part = raw.trim();
    const match = part.match(/^(.*?)\s*<([^<>]+)>$/);
    const email = normalizeGoogleEmail(match?.[2] ?? part);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return [];
    const rawName = match?.[1]?.trim() ?? "";
    const name = rawName.replace(/^"|"$/g, "").replace(/\\"/g, '"').trim();
    return [{ email, name: name || null }];
  });
}
