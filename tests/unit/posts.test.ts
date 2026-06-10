// Unit tests for scheduler validation helpers.
import { describe, expect, it } from "vitest";
import { postSchema, nextRecurringDate } from "@/lib/validations/posts";

describe("post validation", () => {
  it("rejects Twitter posts over 280 characters", () => {
    const parsed = postSchema.safeParse({
      body: "x".repeat(281),
      platform: "TWITTER",
      socialAccountId: "account_1",
      mediaUrls: [],
      status: "DRAFT"
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects scheduled dates in the past", () => {
    const parsed = postSchema.safeParse({
      body: "Hello",
      platform: "LINKEDIN",
      socialAccountId: "account_1",
      mediaUrls: [],
      status: "SCHEDULED",
      scheduledAt: new Date(Date.now() - 60_000).toISOString()
    });
    expect(parsed.success).toBe(false);
  });

  it("generates the next weekly recurring date", () => {
    const next = nextRecurringDate("WEEKLY", new Date("2026-01-01T00:00:00.000Z"));
    expect(next.toISOString()).toBe("2026-01-08T00:00:00.000Z");
  });
});
