// API key management endpoint with HMAC-SHA256 hash-only storage.
import { createHmac, randomBytes } from "crypto";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/utils";

// [H-4] HMAC-SHA256 with a server-side secret — far more resistant to GPU cracking
//        than raw SHA-256. Requires API_KEY_SECRET env var.
function hashKey(key: string): string {
  const secret = process.env.API_KEY_SECRET;
  if (!secret) throw new Error("API_KEY_SECRET environment variable is required.");
  return createHmac("sha256", secret).update(key).digest("hex");
}

export async function GET() {
  try {
    const user = await requireUser();
    const items = await db.apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, prefix: true, lastFour: true, createdAt: true, lastUsedAt: true, revokedAt: true }
    });
    return Response.json({ items });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    const name = body.name?.trim() || "Default API key";
    if (name.length > 80) return jsonError("API key name must be 80 characters or fewer.", 422);
    const rawKey = `crm_live_${randomBytes(24).toString("hex")}`;
    const keyHash = hashKey(rawKey);
    const item = await db.apiKey.create({
      data: {
        userId: user.id,
        name,
        prefix: rawKey.slice(0, 10),
        lastFour: rawKey.slice(-4),
        keyHash
      },
      select: { id: true, name: true, prefix: true, lastFour: true, createdAt: true }
    });
    // Raw key shown once — never stored in plaintext.
    return Response.json({ item, key: rawKey }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
