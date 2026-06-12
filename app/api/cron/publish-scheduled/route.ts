// Cron endpoint: publishes all due scheduled posts.
// Call this from an external scheduler (Vercel Cron, GitHub Actions, docker cron).
// Secured by a CRON_SECRET bearer token — never expose this URL publicly without it.
import { authErrorResponse } from "@/lib/auth";
import { runScheduler } from "@/lib/scheduler";

async function handleCron(request: Request) {
  try {
    // Validate the shared secret so only your cron runner can trigger this.
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return Response.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
    }

    const authHeader = request.headers.get("authorization");
    const provided = authHeader?.replace(/^Bearer\s+/i, "").trim();
    if (!provided || provided !== cronSecret) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const result = await runScheduler();
    return Response.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const GET = handleCron;
export const POST = handleCron;

// Vercel Cron config — runs every minute if deployed on Vercel.
// See: https://vercel.com/docs/cron-jobs
export const dynamic = "force-dynamic";
