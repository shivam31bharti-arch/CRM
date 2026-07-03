import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildGoogleAuthorizationUrl,
  GOOGLE_SCOPES,
  googleConfiguration,
  hashOAuthState,
  mergeGoogleTokenUpdate,
  normalizeGoogleEmail,
  parseGoogleAddressHeader,
  safeGoogleSyncError,
  singleMatchedContactId,
  verifyOAuthState
} from "../lib/google-workspace/core";

test("Google Workspace requests only the approved least-privilege scopes", () => {
  assert.deepEqual(GOOGLE_SCOPES, [
    "openid",
    "email",
    "https://www.googleapis.com/auth/gmail.metadata",
    "https://www.googleapis.com/auth/calendar.events.owned.readonly"
  ]);
});

test("Google configuration stays build-safe when credentials are absent", () => {
  assert.deepEqual(googleConfiguration({}), {
    configured: false,
    clientId: "",
    clientSecret: "",
    redirectUri: ""
  });
});

test("OAuth state is stored as a hash and compared safely", () => {
  const state = "a-random-state-token";
  const digest = hashOAuthState(state);
  assert.notEqual(digest, state);
  assert.equal(verifyOAuthState(state, digest), true);
  assert.equal(verifyOAuthState("wrong", digest), false);
});

test("Google authorization requests offline access and the exact approved scopes", () => {
  const url = new URL(
    buildGoogleAuthorizationUrl(
      {
        configured: true,
        clientId: "client-id",
        clientSecret: "client-secret",
        redirectUri: "https://crm.example.com/api/integrations/google/callback"
      },
      "state-token"
    )
  );
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("state"), "state-token");
  assert.deepEqual(url.searchParams.get("scope")?.split(" "), [...GOOGLE_SCOPES]);
});

test("refreshing a Google token preserves the prior refresh token when Google omits it", () => {
  assert.deepEqual(
    mergeGoogleTokenUpdate("existing-refresh", {
      access_token: "new-access",
      expires_in: 3600
    }),
    {
      accessToken: "new-access",
      refreshToken: "existing-refresh",
      expiresInSeconds: 3600
    }
  );
});

test("Gmail header parsing normalizes addresses without retaining message bodies", () => {
  assert.deepEqual(
    parseGoogleAddressHeader('Jane Doe <Jane@Example.COM>, "Smith, Sam" <sam@example.com>'),
    [
      { email: "jane@example.com", name: "Jane Doe" },
      { email: "sam@example.com", name: "Smith, Sam" }
    ]
  );
  assert.equal(normalizeGoogleEmail("  PERSON@Example.com "), "person@example.com");
});

test("contact matching links only one unambiguous existing CRM contact", () => {
  assert.equal(singleMatchedContactId([]), null);
  assert.equal(singleMatchedContactId([{ id: "one" }]), "one");
  assert.equal(singleMatchedContactId([{ id: "one" }, { id: "duplicate" }]), null);
});

test("stored sync errors never contain raw Google provider text", () => {
  assert.equal(
    safeGoogleSyncError(new Error("provider-secret-diagnostic")),
    "Google Workspace sync failed. Try again or reconnect the account."
  );
});

test("Google migration is transactional and protects idempotency", async () => {
  const migration = await readFile(
    "prisma/migrations/20260623090000_add_google_workspace/migration.sql",
    "utf8"
  );
  assert.match(migration, /^BEGIN;/);
  assert.match(migration, /CREATE TABLE "GoogleConnection"/);
  assert.match(migration, /CREATE UNIQUE INDEX "GoogleConnection_userId_key"/);
  assert.match(migration, /CREATE UNIQUE INDEX "GoogleEmailRecord_connectionId_externalId_key"/);
  assert.match(
    migration,
    /CREATE UNIQUE INDEX "GoogleCalendarEvent_connectionId_calendarId_externalId_key"/
  );
  assert.match(migration, /COMMIT;\s*$/);
});

test("Google routes never expose encrypted tokens", async () => {
  const statusRoute = await readFile("app/api/integrations/google/status/route.ts", "utf8");
  assert.doesNotMatch(statusRoute, /accessToken\s*:\s*true/);
  assert.doesNotMatch(statusRoute, /refreshToken\s*:\s*true/);
  assert.match(statusRoute, /requireUser/);
});

test("disconnect purges local credentials before best-effort provider revocation", async () => {
  const route = await readFile("app/api/integrations/google/disconnect/route.ts", "utf8");
  const localDelete = route.indexOf("googleConnection.delete");
  const remoteRevoke = route.lastIndexOf("revokeGooglePlainToken");
  assert.ok(localDelete >= 0);
  assert.ok(remoteRevoke > localDelete);
  assert.match(route, /revokeGooglePlainToken[\s\S]*?\.catch/);

  const card = await readFile("components/settings/GoogleWorkspaceCard.tsx", "utf8");
  assert.match(card, /window\.confirm/);
});
