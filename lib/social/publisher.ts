// Unified publisher — routes to the correct platform adapter.
import { Platform } from "@prisma/client";
import { publishTwitterPost } from "./twitter";
import { publishLinkedInPost } from "./linkedin";
import { publishFacebookPost } from "./facebook";
import { publishInstagramPost } from "./instagram";
import { resolveMediaForPublishing } from "@/lib/supabase-storage";
import { validatePlatformMedia } from "@/lib/media-storage";

export interface PublishOptions {
  platform: Platform;
  body: string;
  mediaUrls: string[];
  accessToken: string;
  refreshToken?: string;
  accountId: string; // platform-specific user/page ID
}

/**
 * Routes a publish request to the correct platform adapter.
 * Returns the external post ID on success.
 * Throws on API error — caller is responsible for marking the post FAILED.
 */
export async function publishPost(opts: PublishOptions): Promise<string> {
  validatePlatformMedia(opts.platform, opts.mediaUrls);
  // Stored media references are converted to short-lived URLs only when a
  // provider publish begins. Existing external HTTPS URLs remain unchanged.
  const mediaUrls = await resolveMediaForPublishing(opts.mediaUrls);

  switch (opts.platform) {
    case Platform.TWITTER: {
      const result = await publishTwitterPost(opts.body, opts.accessToken, mediaUrls);
      return result.externalId;
    }

    case Platform.LINKEDIN: {
      // LinkedIn needs the author URN — accountId is stored as the member URN.
      const authorUrn = opts.accountId.startsWith("urn:li:")
        ? opts.accountId
        : `urn:li:person:${opts.accountId}`;
      const result = await publishLinkedInPost(opts.body, opts.accessToken, authorUrn, mediaUrls);
      return result.externalId;
    }

    case Platform.FACEBOOK: {
      const result = await publishFacebookPost(
        opts.body,
        opts.accessToken,
        opts.accountId,
        mediaUrls
      );
      return result.externalId;
    }

    case Platform.INSTAGRAM: {
      const result = await publishInstagramPost(
        opts.body,
        opts.accessToken,
        opts.accountId,
        mediaUrls
      );
      return result.externalId;
    }

    default:
      throw new Error(`Unsupported platform: ${opts.platform}`);
  }
}
