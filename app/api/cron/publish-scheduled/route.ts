// Publishes due scheduled posts. Hobby runs daily; production moves to hourly.
import { timingSafeEqual } from "crypto";
import { authErrorResponse } from "@/lib/auth";
import { runScheduler } from "@/lib/scheduler";
import { runGoogleWorkspaceSyncs } from "@/lib/google-workspace/sync";

function matchesSecret(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

async function handleCron(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return Response.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
    }

    const authHeader = request.headers.get("authorization");
    const provided = authHeader?.replace(/^Bearer\s+/i, "").trim();
    if (!provided || !matchesSecret(provided, cronSecret)) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const publishing = await runScheduler();
    const googleWorkspace = await runGoogleWorkspaceSyncs().catch((error) => {
      console.error("[Cron] Google Workspace sync failed:", error);
      return { processed: 0, succeeded: 0, failed: 1, skipped: 0 };
    });
    return Response.json({ ...publishing, googleWorkspace });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const GET = handleCron;
export const POST = handleCron;
export const dynamic = "force-dynamic";
