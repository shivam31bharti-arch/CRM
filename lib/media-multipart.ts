import Busboy from "busboy";
import { once } from "node:events";
import { MAX_MEDIA_BYTES } from "@/lib/media-storage";

export const MAX_MULTIPART_OVERHEAD_BYTES = 256 * 1024;
export const MAX_MEDIA_REQUEST_BYTES = MAX_MEDIA_BYTES + MAX_MULTIPART_OVERHEAD_BYTES;

export class MediaMultipartError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 413 | 415 | 422
  ) {
    super(message);
  }
}

export type ParsedMediaFile = {
  bytes: Uint8Array;
  name: string;
  type: string;
  size: number;
};

export async function parseMediaMultipart(request: Request): Promise<ParsedMediaFile> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    throw new MediaMultipartError("Upload must use multipart form data.", 400);
  }
  if (!request.body) throw new MediaMultipartError("Choose a media file to upload.", 422);

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_MEDIA_REQUEST_BYTES) {
    throw new MediaMultipartError("Upload request is too large.", 413);
  }

  let parser: ReturnType<typeof Busboy>;
  try {
    parser = Busboy({
      headers: { "content-type": contentType },
      limits: {
        fileSize: MAX_MEDIA_BYTES,
        files: 2,
        fields: 1,
        parts: 2
      }
    });
  } catch {
    throw new MediaMultipartError("Upload must use valid multipart form data.", 400);
  }

  const reader = request.body.getReader();
  let totalRequestBytes = 0;
  let parsed: ParsedMediaFile | undefined;
  let parseError: MediaMultipartError | undefined;
  let sawFile = false;
  let requestTooLarge = false;

  const fail = (error: MediaMultipartError) => {
    parseError ??= error;
  };

  parser.on("file", (fieldName, stream, info) => {
    if (fieldName !== "file" || sawFile) {
      fail(new MediaMultipartError("Upload must contain exactly one file field.", 422));
      stream.resume();
      return;
    }
    sawFile = true;
    const chunks: Buffer[] = [];
    let size = 0;
    let truncated = false;
    stream.on("limit", () => {
      truncated = true;
      fail(new MediaMultipartError("Media file is too large.", 413));
    });
    stream.on("error", () => undefined);
    stream.on("data", (chunk: Buffer) => {
      if (truncated || parseError) return;
      size += chunk.length;
      if (size > MAX_MEDIA_BYTES) {
        fail(new MediaMultipartError("Media file is too large.", 413));
        return;
      }
      chunks.push(chunk);
    });
    stream.on("end", () => {
      if (!truncated && !parseError) {
        parsed = {
          bytes: new Uint8Array(Buffer.concat(chunks, size)),
          name: info.filename,
          type: info.mimeType,
          size
        };
      }
    });
  });
  parser.on("field", () =>
    fail(new MediaMultipartError("Upload must contain exactly one file field.", 422))
  );
  parser.on("filesLimit", () =>
    fail(new MediaMultipartError("Upload must contain exactly one file field.", 422))
  );
  parser.on("fieldsLimit", () =>
    fail(new MediaMultipartError("Upload must contain exactly one file field.", 422))
  );
  parser.on("partsLimit", () =>
    fail(new MediaMultipartError("Upload must contain exactly one file field.", 422))
  );

  const parserFinished = new Promise<void>((resolve, reject) => {
    parser.once("finish", resolve);
    parser.once("error", reject);
  });
  void parserFinished.catch(() => undefined);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalRequestBytes += value.byteLength;
      if (totalRequestBytes > MAX_MEDIA_REQUEST_BYTES) {
        requestTooLarge = true;
        fail(new MediaMultipartError("Upload request is too large.", 413));
        break;
      }
      if (!parser.write(Buffer.from(value))) await once(parser, "drain");
    }

    if (requestTooLarge) {
      await reader.cancel().catch(() => undefined);
      parser.destroy();
      throw parseError;
    }
    parser.end();
    await parserFinished;
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    parser.destroy();
    if (error instanceof MediaMultipartError) throw error;
    throw new MediaMultipartError("Upload must use valid multipart form data.", 400);
  }

  if (parseError) throw parseError;
  if (!sawFile || !parsed) {
    throw new MediaMultipartError("Upload must contain exactly one file field.", 422);
  }
  return parsed;
}
