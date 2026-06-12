// LinkedIn publishing adapter using the LinkedIn Share API (OAuth 2.0).
// Requires LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET env vars.

const LINKEDIN_API = "https://api.linkedin.com/v2";

export interface LinkedInPostResult {
  externalId: string;
}

/**
 * Publishes a LinkedIn post (UGC Share) on behalf of the authenticated user.
 * Access token must have w_member_social scope.
 */
export async function publishLinkedInPost(
  body: string,
  accessToken: string,
  authorUrn: string, // e.g. "urn:li:person:ABC123" — stored as accountId
  mediaUrls: string[] = []
): Promise<LinkedInPostResult> {
  // Build the share content.
  const shareContent: Record<string, unknown> = {
    shareCommentary: { text: body },
    shareMediaCategory: mediaUrls.length > 0 ? "IMAGE" : "NONE"
  };

  if (mediaUrls.length > 0) {
    shareContent.media = mediaUrls.slice(0, 9).map((url) => ({
      status: "READY",
      originalUrl: url
    }));
  }

  const body_ = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": shareContent
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
    }
  };

  const res = await fetch(`${LINKEDIN_API}/ugcPosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0"
    },
    body: JSON.stringify(body_)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`LinkedIn API error ${res.status}: ${errorText}`);
  }

  // LinkedIn returns the post URN in the X-RestLi-Id header.
  const externalId = res.headers.get("x-restli-id") ?? res.headers.get("X-RestLi-Id") ?? "unknown";
  return { externalId };
}
