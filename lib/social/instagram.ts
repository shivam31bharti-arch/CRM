// Instagram publishing adapter using the Meta Graph API (Instagram Graph API).
// Works with Instagram Professional accounts connected to a Facebook Page.
// Requires an Instagram Business/Creator account linked to a Facebook Page.

const GRAPH_API = "https://graph.facebook.com/v19.0";

export interface InstagramPostResult {
  externalId: string;
}

/**
 * Publishes to an Instagram Professional account using the two-step container approach:
 * 1. Create a media container (image or text/reel).
 * 2. Publish the container.
 *
 * @param body          - Caption text (max 2200 chars).
 * @param accessToken   - Instagram user access token (linked to Facebook page).
 * @param igUserId      - Instagram Business Account ID (stored as accountId).
 * @param mediaUrls     - Image URLs (at least one required for feed posts).
 */
export async function publishInstagramPost(
  body: string,
  accessToken: string,
  igUserId: string,
  mediaUrls: string[] = []
): Promise<InstagramPostResult> {
  if (mediaUrls.length === 0) {
    throw new Error(
      "Instagram requires at least one image URL. Text-only posts are not supported on Instagram feed."
    );
  }

  // Step 1: Create the media container.
  const containerRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: mediaUrls[0],
      caption: body.slice(0, 2200), // Instagram caption limit
      access_token: accessToken
    })
  });

  if (!containerRes.ok) {
    const errData = await containerRes.json().catch(() => ({ error: { message: containerRes.statusText } }));
    const msg = (errData as { error?: { message?: string } }).error?.message ?? containerRes.statusText;
    throw new Error(`Instagram container creation error ${containerRes.status}: ${msg}`);
  }

  const { id: containerId } = (await containerRes.json()) as { id: string };

  // Step 2: Publish the container (may need polling for videos; images are synchronous).
  const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: accessToken
    })
  });

  if (!publishRes.ok) {
    const errData = await publishRes.json().catch(() => ({ error: { message: publishRes.statusText } }));
    const msg = (errData as { error?: { message?: string } }).error?.message ?? publishRes.statusText;
    throw new Error(`Instagram publish error ${publishRes.status}: ${msg}`);
  }

  const { id: externalId } = (await publishRes.json()) as { id: string };
  return { externalId };
}
