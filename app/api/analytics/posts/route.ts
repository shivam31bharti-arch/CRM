// Post performance analytics endpoint with CSV export support.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    await requireUser();
    const params = new URL(request.url).searchParams;
    const items = await db.post.findMany({
      include: { analytics: { orderBy: { recordedAt: "desc" }, take: 1 }, socialAccount: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    const rows = items.map((post) => ({
      id: post.id,
      platform: post.platform,
      body: post.body,
      likes: post.analytics[0]?.likes ?? 0,
      comments: post.analytics[0]?.comments ?? 0,
      shares: post.analytics[0]?.shares ?? 0,
      reach: post.analytics[0]?.reach ?? 0,
      impressions: post.analytics[0]?.impressions ?? 0
    }));
    if (params.get("export") === "csv") {
      return new Response(toCsv(rows), { headers: { "Content-Type": "text/csv" } });
    }
    return Response.json({ items: rows, total: rows.length });
  } catch (error) {
    return authErrorResponse(error);
  }
}
