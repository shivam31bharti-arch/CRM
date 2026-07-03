import "server-only";

import { db } from "@/lib/db";
import { removedStorageReferences, selectUnreferencedStorageReferences } from "@/lib/media-storage";
import { deleteOwnedMedia } from "@/lib/supabase-storage";

export async function mediaReferenceCount(reference: string) {
  return db.post.count({ where: { mediaUrls: { has: reference } } });
}

export async function cleanupUnreferencedOwnedMedia(userId: string, references: string[]) {
  let unreferenced: string[];
  try {
    unreferenced = await selectUnreferencedStorageReferences(references, mediaReferenceCount);
  } catch (error) {
    console.error("Media cleanup skipped because reference lookup failed.", error);
    return;
  }

  await Promise.all(
    unreferenced.map(async (reference) => {
      try {
        await deleteOwnedMedia(userId, reference);
      } catch (error) {
        console.error("Unreferenced media object could not be removed.", error);
      }
    })
  );
}

export async function cleanupRemovedOwnedMedia(
  userId: string,
  previous: string[],
  current: string[]
) {
  return cleanupUnreferencedOwnedMedia(userId, removedStorageReferences(previous, current));
}
