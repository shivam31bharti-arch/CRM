// OAuth 2.0 flow initiator and callback handler for all social platforms.
// GET /api/social-accounts/connect?platform=TWITTER|LINKEDIN|FACEBOOK|INSTAGRAM
// GET /api/social-accounts/connect?platform=...&code=...&state=... (callback)
import { Platform } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { encryptToken } from "@/lib/crypto";
import { jsonError } from "@/lib/utils";

function platformConfig(platform: Platform, baseUrl: string) {
  switch (platform) {
    case Platform.TWITTER:
      return {
        authUrl: "https://twitter.com/i/oauth2/authorize",
        tokenUrl: "https://api.twitter.com/2/oauth2/token",
        clientId: process.env.TWITTER_CLIENT_ID ?? "",
        clientSecret: process.env.TWITTER_CLIENT_SECRET ?? "",
        scope: "tweet.read tweet.write users.read offline.access",
        redirectUri: `${baseUrl}/api/social-accounts/connect?platform=TWITTER`
      };
    case Platform.LINKEDIN:
      return {
        authUrl: "https://www.linkedin.com/oauth/v2/authorization",
        tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
        clientId: process.env.LINKEDIN_CLIENT_ID ?? "",
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
        scope: "openid profile w_member_social",
        redirectUri: `${baseUrl}/api/social-accounts/connect?platform=LINKEDIN`
      };
    case Platform.FACEBOOK:
      return {
        authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
        tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
        clientId: process.env.FACEBOOK_APP_ID ?? "",
        clientSecret: process.env.FACEBOOK_APP_SECRET ?? "",
        scope: "pages_manage_posts,pages_read_engagement",
        redirectUri: `${baseUrl}/api/social-accounts/connect?platform=FACEBOOK`
      };
    case Platform.INSTAGRAM:
      return {
        authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
        tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
        clientId: process.env.FACEBOOK_APP_ID ?? "",
        clientSecret: process.env.FACEBOOK_APP_SECRET ?? "",
        scope: "instagram_basic,instagram_content_publish,pages_read_engagement",
        redirectUri: `${baseUrl}/api/social-accounts/connect?platform=INSTAGRAM`
      };
  }
}

function generateCodeVerifier() {
  return randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

function cookieName(name: string, platform: Platform) {
  return `${name}_${platform}`;
}

function setCookie(name: string, value: string, secure: boolean) {
  return `${name}=${value}; HttpOnly;${secure ? " Secure;" : ""} SameSite=Lax; Max-Age=600; Path=/`;
}

function clearCookie(name: string, secure: boolean) {
  return `${name}=; HttpOnly;${secure ? " Secure;" : ""} SameSite=Lax; Max-Age=0; Path=/`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const platform = url.searchParams.get("platform") as Platform | null;
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const baseUrl = process.env.NEXTAUTH_URL ?? url.origin;
    const secureCookies = baseUrl.startsWith("https://");

    if (!platform || !Object.values(Platform).includes(platform)) {
      return jsonError("platform query parameter is required (TWITTER|LINKEDIN|FACEBOOK|INSTAGRAM).", 422);
    }

    const cfg = platformConfig(platform, baseUrl);
    if (!cfg.clientId || !cfg.clientSecret) {
      return jsonError(`${platform} OAuth is not configured. Add the required env vars (see .env.example).`, 503);
    }

    if (code && !state) return jsonError("OAuth state is missing.", 400);

    if (code && state) {
      if (error) return jsonError(`OAuth error from ${platform}: ${error}`, 400);

      const stateCookieName = cookieName("oauth_state", platform);
      const expectedState = request.cookies.get(stateCookieName)?.value;
      if (!expectedState || expectedState !== state) return jsonError("Invalid OAuth state.", 400);

      const tokenParams: Record<string, string> = {
        grant_type: "authorization_code",
        code,
        redirect_uri: cfg.redirectUri,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret
      };

      if (platform === Platform.TWITTER) {
        const verifierCookie = request.cookies.get(cookieName("pkce_verifier", platform))?.value;
        if (!verifierCookie) return jsonError("OAuth verifier is missing.", 400);
        tokenParams.code_verifier = verifierCookie;
      }

      const tokenRes = await fetch(cfg.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          ...(platform === Platform.TWITTER
            ? { Authorization: `Basic ${Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64")}` }
            : {})
        },
        body: new URLSearchParams(tokenParams)
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Token exchange failed for ${platform}: ${errText}`);
      }

      const tokenData = (await tokenRes.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
        token_type?: string;
      };

      const { accountId, accountName, accessToken } = await fetchAccountInfo(platform, tokenData.access_token);
      const storedAccessToken = accessToken ?? tokenData.access_token;
      const tokenExpiry = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null;

      await db.socialAccount.upsert({
        where: { platform_accountId: { platform, accountId } },
        update: {
          accessToken: encryptToken(storedAccessToken),
          refreshToken: tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null,
          tokenExpiry,
          accountName,
          isActive: true,
          userId: user.id
        },
        create: {
          platform,
          accountId,
          accountName,
          accessToken: encryptToken(storedAccessToken),
          refreshToken: tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null,
          tokenExpiry,
          userId: user.id,
          isActive: true
        }
      });

      const redirect = Response.redirect(`${baseUrl}/settings?connected=${platform.toLowerCase()}`, 302);
      redirect.headers.append("Set-Cookie", clearCookie(stateCookieName, secureCookies));
      redirect.headers.append("Set-Cookie", clearCookie(cookieName("pkce_verifier", platform), secureCookies));
      return redirect;
    }

    const stateToken = randomBytes(16).toString("hex");
    const authUrl = new URL(cfg.authUrl);
    authUrl.searchParams.set("client_id", cfg.clientId);
    authUrl.searchParams.set("redirect_uri", cfg.redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", cfg.scope);
    authUrl.searchParams.set("state", stateToken);

    const cookies = [setCookie(cookieName("oauth_state", platform), stateToken, secureCookies)];

    if (platform === Platform.TWITTER) {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);
      authUrl.searchParams.set("code_challenge", challenge);
      authUrl.searchParams.set("code_challenge_method", "S256");
      cookies.push(setCookie(cookieName("pkce_verifier", platform), verifier, secureCookies));
    }

    const headers = new Headers({ Location: authUrl.toString() });
    for (const cookie of cookies) headers.append("Set-Cookie", cookie);
    return new Response(null, { status: 302, headers });
  } catch (error) {
    return authErrorResponse(error);
  }
}

type AccountInfo = {
  accountId: string;
  accountName: string;
  accessToken?: string;
};

async function fetchAccountInfo(platform: Platform, accessToken: string): Promise<AccountInfo> {
  switch (platform) {
    case Platform.TWITTER: {
      const res = await fetch("https://api.twitter.com/2/users/me?user.fields=name,username", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error("Failed to fetch Twitter user info.");
      const data = (await res.json()) as { data: { id: string; username: string; name: string } };
      return { accountId: data.data.id, accountName: `@${data.data.username}` };
    }

    case Platform.LINKEDIN: {
      const res = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error("Failed to fetch LinkedIn user info.");
      const data = (await res.json()) as { sub: string; name: string };
      return { accountId: data.sub, accountName: data.name };
    }

    case Platform.FACEBOOK: {
      const res = await fetch("https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error("Failed to fetch Facebook Pages.");
      const data = (await res.json()) as { data: Array<{ id: string; name: string; access_token?: string }> };
      const page = data.data[0];
      if (!page) throw new Error("No Facebook Pages found. Please create a Facebook Page first.");
      return { accountId: page.id, accountName: page.name, accessToken: page.access_token };
    }

    case Platform.INSTAGRAM: {
      const pagesRes = await fetch(
        "https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,name,username}",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!pagesRes.ok) throw new Error("Failed to fetch Instagram account.");
      const pagesData = (await pagesRes.json()) as {
        data: Array<{
          access_token?: string;
          instagram_business_account?: { id: string; name: string; username: string };
        }>;
      };
      const page = pagesData.data.find((item) => item.instagram_business_account);
      const igAccount = page?.instagram_business_account;
      if (!igAccount) {
        throw new Error("No Instagram Business/Creator account found. Link your Instagram account to a Facebook Page first.");
      }
      return { accountId: igAccount.id, accountName: `@${igAccount.username}`, accessToken: page?.access_token };
    }
  }
}

export const dynamic = "force-dynamic";
