import { Platform } from "@prisma/client";
import { jsonError } from "@/lib/utils";

export async function GET(request: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { platform: platformParam } = await params;
  const platform = platformParam.toUpperCase() as Platform;
  if (!Object.values(Platform).includes(platform)) return jsonError("Unsupported platform.", 404);

  const url = new URL("/api/social-accounts/connect", request.url);
  url.searchParams.set("platform", platform);
  return Response.redirect(url, 308);
}
