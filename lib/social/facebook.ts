// Facebook publishing adapter using the Meta Graph API.
// Publishes to a Facebook Page (not a personal profile — Pages API only).
// Requires a Page access token stored in the SocialAccount record.

const GRAPH_API = "https://graph.facebook.com/v19.0";

export interface FacebookPostResult {
  externalId: string;
}

/**
 * Publishes a post to a Facebook Page.
 *
 * @param body         - Post text content.
 * @param accessToken  - Facebook Page access token (long-lived).
 * @param pageId       - Facebook Page ID (stored as accountId in SocialAccount).
 * @param mediaUrls    - Optional image URLs (first image used if provided).
 */
export async function publishFacebookPost(
  body: string,
  accessToken: string,
  pageId: string,
  mediaUrls: string[] = []
): Promise<FacebookPostResult> {
  let endpoint: string;
  let requestBody: Record<string, string>;

  if (mediaUrls.length > 0) {
    // Post with photo — uses /photos endpoint.
    endpoint = `${GRAPH_API}/${pageId}/photos`;
    requestBody = {
      caption: body,
      url: mediaUrls[0],
      access_token: accessToken,
      published: "true"
    };
  } else {
    // Text-only post — uses /feed endpoint.
    endpoint = `${GRAPH_API}/${pageId}/feed`;
    requestBody = {
      message: body,
      access_token: accessToken
    };
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: { message: res.statusText } }));
    const msg = (errorData as { error?: { message?: string } }).error?.message ?? res.statusText;
    throw new Error(`Facebook Graph API error ${res.status}: ${msg}`);
  }

  const data = (await res.json()) as { id?: string; post_id?: string };
  const externalId = data.post_id ?? data.id ?? "unknown";
  return { externalId };
}
