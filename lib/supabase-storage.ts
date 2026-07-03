import "server-only";

import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  areMediaReferencesOwnedBy,
  buildMediaObjectPath,
  buildStorageReference,
  isOwnedStorageReference,
  MAX_USER_MEDIA_OBJECTS,
  parseStorageReference,
  resolvePublishableMediaUrls,
  validateStorageQuota
} from "@/lib/media-storage";
import { readSupabaseStorageConfig } from "@/lib/supabase-storage-config";

type StorageConfig = ReturnType<typeof readSupabaseStorageConfig>;
const QUOTA_LIST_PAGE_SIZE = 50;
const QUOTA_LIST_MAX_PAGES = Math.ceil(MAX_USER_MEDIA_OBJECTS / QUOTA_LIST_PAGE_SIZE);

let cachedClient: { url: string; key: string; client: SupabaseClient } | undefined;
let bucketCheck: { bucket: string; check: Promise<void> } | undefined;

function getConfig(): StorageConfig {
  return readSupabaseStorageConfig({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET
  });
}

function getAdminClient(config: StorageConfig) {
  if (cachedClient?.url === config.url && cachedClient.key === config.serviceRoleKey) {
    return cachedClient.client;
  }

  const client = createClient(config.url, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  cachedClient = { url: config.url, key: config.serviceRoleKey, client };
  bucketCheck = undefined;
  return client;
}

async function requirePrivateBucket(config: StorageConfig, client: SupabaseClient) {
  if (bucketCheck?.bucket === config.bucket) return bucketCheck.check;

  const check = (async () => {
    const { data, error } = await client.storage.getBucket(config.bucket);
    if (error || !data) {
      throw new Error(`Supabase Storage bucket "${config.bucket}" is unavailable.`);
    }
    if (data.public) {
      throw new Error(`Supabase Storage bucket "${config.bucket}" must be private.`);
    }
  })();
  bucketCheck = { bucket: config.bucket, check };
  try {
    await check;
  } catch (error) {
    if (bucketCheck?.check === check) bucketCheck = undefined;
    throw error;
  }
}

async function requireAvailableUserQuota(
  config: StorageConfig,
  client: SupabaseClient,
  userId: string,
  incomingBytes: number
) {
  const prefix = `users/${encodeURIComponent(userId)}`;
  const objects: Array<{ size: number | undefined }> = [];
  // Storage has no atomic quota reservation. This bounded check deliberately
  // fails closed on listing errors; a small race between concurrent uploads remains.
  for (let page = 0; page < QUOTA_LIST_MAX_PAGES; page += 1) {
    const { data, error } = await client.storage.from(config.bucket).list(prefix, {
      limit: QUOTA_LIST_PAGE_SIZE,
      offset: page * QUOTA_LIST_PAGE_SIZE,
      sortBy: { column: "name", order: "asc" }
    });
    if (error || !data) throw new Error("Media storage quota could not be verified.");
    objects.push(
      ...data.map((object) => ({
        size: typeof object.metadata?.size === "number" ? object.metadata.size : undefined
      }))
    );
    if (data.length < QUOTA_LIST_PAGE_SIZE) break;
  }
  validateStorageQuota(objects, incomingBytes);
}

export async function uploadOwnedMedia(userId: string, bytes: Uint8Array, mimeType: string) {
  const config = getConfig();
  const client = getAdminClient(config);
  await requirePrivateBucket(config, client);
  await requireAvailableUserQuota(config, client, userId, bytes.byteLength);

  const objectPath = buildMediaObjectPath(userId, randomUUID(), mimeType);
  const { error } = await client.storage.from(config.bucket).upload(objectPath, bytes, {
    cacheControl: "3600",
    contentType: mimeType,
    upsert: false
  });
  if (error) throw new Error("Supabase Storage could not save the media file.");
  return buildStorageReference(config.bucket, objectPath);
}

export async function deleteOwnedMedia(userId: string, reference: string) {
  const config = getConfig();
  if (!isOwnedStorageReference(reference, userId, config.bucket)) {
    throw new Error("The media object is not owned by the authenticated user.");
  }
  const parsed = parseStorageReference(reference);
  if (!parsed) throw new Error("Invalid storage reference.");

  const client = getAdminClient(config);
  await requirePrivateBucket(config, client);
  const { error } = await client.storage.from(config.bucket).remove([parsed.objectPath]);
  if (error) throw new Error("Supabase Storage could not remove the media file.");
}

export function mediaReferencesBelongToUser(userId: string, references: string[]) {
  if (!references.some((reference) => parseStorageReference(reference))) return true;
  const config = getConfig();
  return areMediaReferencesOwnedBy(references, userId, config.bucket);
}

export async function resolveMediaForPublishing(references: string[]) {
  const containsStoredObject = references.some((reference) => parseStorageReference(reference));
  if (!containsStoredObject) {
    return resolvePublishableMediaUrls(references, {
      configuredBucket: "",
      createSignedUrl: async () => {
        throw new Error("Unexpected stored media reference.");
      }
    });
  }

  const config = getConfig();
  const client = getAdminClient(config);
  await requirePrivateBucket(config, client);
  return resolvePublishableMediaUrls(references, {
    configuredBucket: config.bucket,
    createSignedUrl: async (bucket, objectPath, expiresIn) => {
      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrl(objectPath, expiresIn);
      if (error || !data?.signedUrl) {
        throw new Error("Supabase Storage could not create a publishing URL.");
      }
      return data.signedUrl;
    }
  });
}
