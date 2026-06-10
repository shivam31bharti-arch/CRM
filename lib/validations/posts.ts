// Zod schemas for social post composer and scheduler APIs.
import { Platform, PostStatus } from "@prisma/client";
import { z } from "zod";
import { platformLimits } from "@/lib/constants";

const basePostSchema = z.object({
    body: z.string().min(1, "Post body is required."),
    mediaUrls: z.array(z.string().url()).max(4).default([]),
    platform: z.nativeEnum(Platform),
    status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
    scheduledAt: z.string().datetime().optional().nullable(),
    socialAccountId: z.string().min(1, "Social account is required."),
    campaignId: z.string().optional().nullable(),
    isRecurring: z.boolean().default(false),
    recurringRule: z.string().optional().nullable()
  });

export const postSchema = basePostSchema
  .superRefine((value, ctx) => {
    if (value.body.length > platformLimits[value.platform]) {
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: `${value.platform} posts must be ${platformLimits[value.platform]} characters or fewer.`
      });
    }
    if (value.scheduledAt && new Date(value.scheduledAt) < new Date()) {
      ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "Schedule date cannot be in the past." });
    }
  });

export const postPatchSchema = basePostSchema.partial();

export function nextRecurringDate(rule: string, from = new Date()) {
  const next = new Date(from);
  if (rule === "DAILY") next.setDate(next.getDate() + 1);
  if (rule === "WEEKLY") next.setDate(next.getDate() + 7);
  if (rule === "MONTHLY") next.setMonth(next.getMonth() + 1);
  return next;
}
