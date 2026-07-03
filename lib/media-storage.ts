export const STORAGE_REFERENCE_PROTOCOL = "supabase-storage:";
export const MAX_MEDIA_MEGABYTES = 4;
export const MAX_MEDIA_BYTES = MAX_MEDIA_MEGABYTES * 1024 * 1024;
export const MAX_MEDIA_ITEMS = 4;
// A practical application-level guardrail. Supabase project limits still apply.
export const MAX_USER_MEDIA_OBJECTS = 100;
export const MAX_USER_MEDIA_BYTES = 100 * 1024 * 1024;
export const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60;

const MEDIA_TYPES = {
  "image/jpeg": { extension: "jpg", mediaKind: "image" },
  "image/png": { extension: "png", mediaKind: "image" },
  "image/webp": { extension: "webp", mediaKind: "image" },
  "image/gif": { extension: "gif", mediaKind: "image" },
  "video/mp4": { extension: "mp4", mediaKind: "video" },
  "video/quicktime": { extension: "mov", mediaKind: "video" },
  "video/webm": { extension: "webm", mediaKind: "video" }
} as const;

export const ACCEPTED_MEDIA_TYPES = Object.keys(MEDIA_TYPES);

export type StorageObjectReference = {
  bucket: string;
  objectPath: string;
};

export function validateMediaUpload(file: { type: string; size: number }) {
  const media = MEDIA_TYPES[file.type as keyof typeof MEDIA_TYPES];
  if (!media) throw new Error("Unsupported media type.");
  if (!Number.isSafeInteger(file.size) || file.size <= 0) {
    throw new Error("The media file is empty.");
  }
  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error(`Media files must be ${MAX_MEDIA_MEGABYTES} MB or smaller.`);
  }
  return media;
}

function matches(bytes: Uint8Array, offset: number, signature: number[]) {
  return signature.every((value, index) => bytes[offset + index] === value);
}

export function hasValidMediaSignature(bytes: Uint8Array, mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return matches(bytes, 0, [0xff, 0xd8, 0xff]);
    case "image/png":
      return matches(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/gif":
      return (
        matches(bytes, 0, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
        matches(bytes, 0, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
      );
    case "image/webp":
      return (
        matches(bytes, 0, [0x52, 0x49, 0x46, 0x46]) && matches(bytes, 8, [0x57, 0x45, 0x42, 0x50])
      );
    case "video/mp4":
    case "video/quicktime":
      return matches(bytes, 4, [0x66, 0x74, 0x79, 0x70]);
    case "video/webm":
      return matches(bytes, 0, [0x1a, 0x45, 0xdf, 0xa3]);
    default:
      return false;
  }
}

export function buildMediaObjectPath(userId: string, objectId: string, mimeType: string) {
  const { extension } = validateMediaUpload({ type: mimeType, size: 1 });
  if (!objectId || !/^[A-Za-z0-9-]+$/.test(objectId)) {
    throw new Error("Invalid media object id.");
  }
  return `users/${encodeURIComponent(userId)}/${objectId}.${extension}`;
}

export function buildStorageReference(bucket: string, objectPath: string) {
  if (!/^[a-z0-9][a-z0-9.-]*$/.test(bucket)) throw new Error("Invalid storage bucket.");
  if (
    !objectPath ||
    objectPath.startsWith("/") ||
    objectPath.includes("?") ||
    objectPath.includes("#")
  ) {
    throw new Error("Invalid storage object path.");
  }
  return `${STORAGE_REFERENCE_PROTOCOL}//${bucket}/${objectPath}`;
}

export function parseStorageReference(value: string): StorageObjectReference | null {
  try {
    const url = new URL(value);
    if (
      url.protocol !== STORAGE_REFERENCE_PROTOCOL ||
      !url.hostname ||
      !url.pathname.startsWith("/") ||
      url.pathname === "/" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return { bucket: url.hostname, objectPath: url.pathname.slice(1) };
  } catch {
    return null;
  }
}

export function isOwnedStorageReference(value: string, userId: string, configuredBucket: string) {
  const parsed = parseStorageReference(value);
  return (
    parsed?.bucket === configuredBucket &&
    parsed.objectPath.startsWith(`users/${encodeURIComponent(userId)}/`)
  );
}

export function areMediaReferencesOwnedBy(
  references: string[],
  userId: string,
  configuredBucket: string
) {
  return references.every((reference) => {
    const stored = parseStorageReference(reference);
    return stored
      ? isOwnedStorageReference(reference, userId, configuredBucket)
      : isAllowedMediaReference(reference);
  });
}

export function isAllowedMediaReference(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") {
      return Boolean(url.hostname) && !url.username && !url.password;
    }
    return parseStorageReference(value) !== null;
  } catch {
    return false;
  }
}

export function validateStorageQuota(
  existingObjects: Array<{ size: number | undefined }>,
  incomingBytes: number
) {
  if (!Number.isSafeInteger(incomingBytes) || incomingBytes <= 0) {
    throw new Error("The incoming media size is invalid.");
  }
  if (existingObjects.length >= MAX_USER_MEDIA_OBJECTS) {
    throw new Error(`Your media storage is limited to ${MAX_USER_MEDIA_OBJECTS} objects.`);
  }
  let usedBytes = 0;
  for (const object of existingObjects) {
    if (!Number.isSafeInteger(object.size) || (object.size ?? -1) < 0) {
      throw new Error("Supabase Storage returned invalid quota metadata.");
    }
    usedBytes += object.size as number;
  }
  if (usedBytes + incomingBytes > MAX_USER_MEDIA_BYTES) {
    throw new Error("Your 100 MB media storage quota would be exceeded.");
  }
}

export function removedStorageReferences(previous: string[], current: string[]) {
  const retained = new Set(current);
  return [...new Set(previous)].filter(
    (reference) => parseStorageReference(reference) && !retained.has(reference)
  );
}

export async function selectUnreferencedStorageReferences(
  references: string[],
  countReferences: (reference: string) => Promise<number>
) {
  const unreferenced: string[] = [];
  for (const reference of [...new Set(references)]) {
    if (!parseStorageReference(reference)) continue;
    if ((await countReferences(reference)) === 0) unreferenced.push(reference);
  }
  return unreferenced;
}

function storedExtension(reference: string) {
  const stored = parseStorageReference(reference);
  if (!stored) return null;
  return stored.objectPath.split(".").at(-1)?.toLowerCase() ?? "";
}

export const PLATFORM_MEDIA_POLICIES = {
  TWITTER: {
    maxItems: 4,
    acceptedTypes: ACCEPTED_MEDIA_TYPES,
    allowExternalUrls: true,
    help: "Up to 4 images or videos"
  },
  FACEBOOK: {
    maxItems: 1,
    acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    allowExternalUrls: true,
    help: "One image"
  },
  INSTAGRAM: {
    maxItems: 1,
    acceptedTypes: ["image/jpeg"],
    allowExternalUrls: true,
    help: "One JPEG image"
  },
  LINKEDIN: {
    maxItems: 0,
    acceptedTypes: [],
    allowExternalUrls: false,
    help: "Media publishing is unavailable until LinkedIn asset upload is configured"
  }
} as const;

export function getPlatformMediaPolicy(platform: string) {
  return PLATFORM_MEDIA_POLICIES[platform as keyof typeof PLATFORM_MEDIA_POLICIES] ?? null;
}

export function validatePlatformMedia(platform: string, references: string[]) {
  const policy = getPlatformMediaPolicy(platform);
  if (!policy) throw new Error("Unsupported social platform.");
  if (platform === "LINKEDIN" && references.length) {
    throw new Error("LinkedIn publishing does not support media until asset upload is configured.");
  }
  if (references.length > policy.maxItems) {
    throw new Error(
      `${platform} posts support at most ${policy.maxItems} media ${policy.maxItems === 1 ? "item" : "items"}.`
    );
  }

  for (const reference of references) {
    const extension = storedExtension(reference);
    if (!extension) continue; // Legacy HTTPS URLs are treated as provider-hosted images.
    if (platform === "FACEBOOK" && !["jpg", "png", "webp", "gif"].includes(extension)) {
      throw new Error("Facebook posts currently support one uploaded image only.");
    }
    if (platform === "INSTAGRAM" && extension !== "jpg") {
      throw new Error("Instagram uploaded media must be one JPEG image.");
    }
  }
}

export async function resolvePublishableMediaUrls(
  references: string[],
  options: {
    configuredBucket: string;
    expiresIn?: number;
    createSignedUrl: (bucket: string, objectPath: string, expiresIn: number) => Promise<string>;
  }
) {
  const expiresIn = options.expiresIn ?? DEFAULT_SIGNED_URL_TTL_SECONDS;
  return Promise.all(
    references.map(async (reference) => {
      const stored = parseStorageReference(reference);
      if (stored) {
        if (stored.bucket !== options.configuredBucket) {
          throw new Error("Media storage reference uses an unconfigured bucket.");
        }
        return options.createSignedUrl(stored.bucket, stored.objectPath, expiresIn);
      }

      if (!isAllowedMediaReference(reference)) {
        throw new Error("External media URLs must use HTTPS.");
      }
      return reference;
    })
  );
}
