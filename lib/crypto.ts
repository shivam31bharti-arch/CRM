// AES-256-GCM helpers for encrypting sensitive credentials at rest.
// [C-2] OAuth tokens must never be stored as plaintext in the database.
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32; // 256-bit key
const IV_BYTES = 12;  // 96-bit IV — recommended for GCM
const TAG_BYTES = 16; // 128-bit auth tag

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is required. " +
        "Generate one with: openssl rand -hex 32"
    );
  }
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== KEY_BYTES) {
    throw new Error("ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).");
  }
  return buf;
}

/**
 * Encrypts a plaintext string and returns a hex-encoded payload:
 *   [12-byte IV][16-byte GCM tag][ciphertext]
 */
export function encryptToken(plain: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return (
    iv.toString("hex") +       // 24 hex chars
    tag.toString("hex") +      // 32 hex chars
    encrypted.toString("hex")  // variable
  );
}

/**
 * Decrypts a payload produced by encryptToken.
 * Throws if the auth tag is invalid (tampered data).
 */
export function decryptToken(stored: string): string {
  const key = getKey();
  const IV_HEX = IV_BYTES * 2;
  const TAG_HEX = TAG_BYTES * 2;
  const iv = Buffer.from(stored.slice(0, IV_HEX), "hex");
  const tag = Buffer.from(stored.slice(IV_HEX, IV_HEX + TAG_HEX), "hex");
  const ciphertext = Buffer.from(stored.slice(IV_HEX + TAG_HEX), "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8");
}
