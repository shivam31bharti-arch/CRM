import { lookup } from "dns/promises";
import { isIP } from "net";

const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;

export function isPublicAddress(address: string) {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }

  if (isIP(address) === 6) {
    const normalized = address.toLowerCase();
    if (normalized.startsWith("::ffff:")) {
      return isPublicAddress(normalized.slice("::ffff:".length));
    }
    return !(
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized)
    );
  }

  return false;
}

async function assertPublicMediaUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("Media URLs must use HTTPS.");
  if (url.username || url.password) throw new Error("Media URLs cannot contain credentials.");

  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error("Media URL resolves to a private or reserved network.");
  }
  return url;
}

export async function fetchExternalMedia(value: string) {
  let url = await assertPublicMediaUrl(value);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000)
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectCount === MAX_REDIRECTS)
        throw new Error("Media redirect limit exceeded.");
      url = await assertPublicMediaUrl(new URL(location, url).toString());
      continue;
    }

    if (!response.ok) throw new Error(`Media download failed with status ${response.status}.`);
    const mimeType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (!mimeType.startsWith("image/") && !mimeType.startsWith("video/")) {
      throw new Error("Media URL must return an image or video.");
    }

    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_MEDIA_BYTES) throw new Error("Media file exceeds the 10 MB limit.");
    if (!response.body) throw new Error("Media response had no body.");

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      received += chunk.byteLength;
      if (received > MAX_MEDIA_BYTES) {
        await reader.cancel();
        throw new Error("Media file exceeds the 10 MB limit.");
      }
      chunks.push(chunk);
    }

    return { buffer: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))), mimeType };
  }

  throw new Error("Media download failed.");
}
