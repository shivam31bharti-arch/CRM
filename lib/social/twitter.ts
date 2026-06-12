// Twitter/X publishing adapter using twitter-api-v2 (OAuth 2.0 user context).
import { TwitterApi } from "twitter-api-v2";

export interface TwitterPostResult {
  externalId: string;
}

/**
 * Publishes a tweet using the user's OAuth 2.0 access token.
 * The token must have tweet.write and users.read scopes.
 */
export async function publishTwitterPost(
  body: string,
  accessToken: string,
  mediaUrls: string[] = []
): Promise<TwitterPostResult> {
  const client = new TwitterApi(accessToken);

  // If there are media attachments, upload them first (requires media.write scope).
  let mediaIds: string[] | undefined;
  if (mediaUrls.length > 0) {
    const uploadedIds = await Promise.all(
      mediaUrls.slice(0, 4).map(async (url) => {
        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());
        const mimeType = response.headers.get("content-type") ?? "image/jpeg";
        return client.v1.uploadMedia(buffer, { mimeType });
      })
    );
    mediaIds = uploadedIds;
  }

  // twitter-api-v2 expects media_ids as a 1–4 element tuple.
  type MediaIds = [string] | [string, string] | [string, string, string] | [string, string, string, string];

  const tweetPayload: Parameters<typeof client.v2.tweet>[0] = { text: body };
  if (mediaIds && mediaIds.length > 0) {
    tweetPayload.media = { media_ids: mediaIds.slice(0, 4) as MediaIds };
  }

  const tweet = await client.v2.tweet(tweetPayload);

  return { externalId: tweet.data.id };
}
