import { authErrorResponse, requireUser } from "@/lib/auth";
import { MAX_MEDIA_BYTES, hasValidMediaSignature, validateMediaUpload } from "@/lib/media-storage";
import { MediaMultipartError, parseMediaMultipart } from "@/lib/media-multipart";
import { db } from "@/lib/db";
import {
  deleteOwnedMedia,
  mediaReferencesBelongToUser,
  uploadOwnedMedia
} from "@/lib/supabase-storage";
import { jsonError } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    let file;
    try {
      file = await parseMediaMultipart(request);
    } catch (error) {
      if (error instanceof MediaMultipartError) return jsonError(error.message, error.status);
      throw error;
    }

    try {
      validateMediaUpload(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid media file.";
      return jsonError(message, file.size > MAX_MEDIA_BYTES ? 413 : 415);
    }

    if (!hasValidMediaSignature(file.bytes, file.type)) {
      return jsonError("The file content does not match its media type.", 415);
    }

    let reference: string;
    try {
      reference = await uploadOwnedMedia(user.id, file.bytes, file.type);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Media upload failed.";
      if (/quota|limited to \d+ objects/i.test(message)) return jsonError(message, 409);
      throw error;
    }
    return Response.json(
      {
        reference,
        file: { name: file.name, type: file.type, size: file.size }
      },
      { status: 201 }
    );
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 4096) return jsonError("Request body is too large.", 413);

    const body = (await request.json().catch(() => null)) as { reference?: unknown } | null;
    if (typeof body?.reference !== "string") {
      return jsonError("A storage reference is required.", 422);
    }
    if (!mediaReferencesBelongToUser(user.id, [body.reference])) {
      return jsonError("You cannot remove this media object.", 403);
    }

    const references = await db.post.count({ where: { mediaUrls: { has: body.reference } } });
    if (references > 0) {
      return jsonError("Remove this media item from every post before deleting it.", 409);
    }

    try {
      await deleteOwnedMedia(user.id, body.reference);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Media could not be removed.";
      if (message.includes("not owned") || message.includes("Invalid storage reference")) {
        return jsonError("You cannot remove this media object.", 403);
      }
      throw error;
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
