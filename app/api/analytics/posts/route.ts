// Post performance analytics endpoint with CSV export support.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, toCsv } from "@/lib/utils";
import { z } from "zod";

const dateParam = z.string().datetime({ offset: true }).optional();

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const params = new URL(request.url).searchParams;
    const fromParsed = dateParam.safeParse(params.get("from") ?? undefined);
    if (!fromParsed.success) return jsonError("Invalid 'from' date. Use ISO 8601 format.", 400);
    const from = fromParsed.data ? new Date(fromParsed.data) : undefined;
    const items = await db.post.findMany({
      where: {
        authorId: user.id,
        OR: from
          ? [{ createdAt: { gte: from } }, { analytics: { some: { recordedAt: { gte: from } } } }]
          : undefined
      },
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
      clicks: post.analytics[0]?.clicks ?? 0,
      reach: post.analytics[0]?.reach ?? 0,
      impressions: post.analytics[0]?.impressions ?? 0,
      recordedAt: (
        post.analytics[0]?.recordedAt ??
        post.publishedAt ??
        post.createdAt
      ).toISOString()
    }));
    if (params.get("export") === "csv") {
      return new Response(toCsv(rows), { headers: { "Content-Type": "text/csv" } });
    }
    return Response.json({ items: rows, total: rows.length });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
