// Zod schemas for social post composer and scheduler APIs.
import { Platform, PostStatus } from "@prisma/client";
import { z } from "zod";
import { platformLimits } from "@/lib/constants";
import { isAllowedMediaReference, validatePlatformMedia } from "@/lib/media-storage";

const basePostSchema = z.object({
  body: z.string().min(1, "Post body is required."),
  mediaUrls: z
    .array(
      z.string().refine(isAllowedMediaReference, {
        message: "Media must be an HTTPS URL or an uploaded storage reference."
      })
    )
    .max(4)
    .default([]),
  platform: z.nativeEnum(Platform),
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
  scheduledAt: z.string().datetime().optional().nullable(),
  socialAccountId: z.string().min(1, "Social account is required."),
  campaignId: z.string().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurringRule: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional().nullable()
});

export const postSchema = basePostSchema.superRefine((value, ctx) => {
  try {
    validatePlatformMedia(value.platform, value.mediaUrls);
  } catch (error) {
    ctx.addIssue({
      code: "custom",
      path: ["mediaUrls"],
      message: error instanceof Error ? error.message : "Unsupported media."
    });
  }
  if (value.body.length > platformLimits[value.platform]) {
    ctx.addIssue({
      code: "custom",
      path: ["body"],
      message: `${value.platform} posts must be ${platformLimits[value.platform]} characters or fewer.`
    });
  }
  if (value.scheduledAt && new Date(value.scheduledAt) < new Date()) {
    ctx.addIssue({
      code: "custom",
      path: ["scheduledAt"],
      message: "Schedule date cannot be in the past."
    });
  }
  if (value.isRecurring && !value.recurringRule) {
    ctx.addIssue({
      code: "custom",
      path: ["recurringRule"],
      message: "Choose a recurring schedule."
    });
  }
});

export const postPatchSchema = basePostSchema.partial();

export function nextRecurringDate(rule: string, from = new Date()) {
  const next = new Date(from);
  if (rule === "DAILY") next.setDate(next.getDate() + 1);
  else if (rule === "WEEKLY") next.setDate(next.getDate() + 7);
  else if (rule === "MONTHLY") next.setMonth(next.getMonth() + 1);
  else throw new Error("Unsupported recurring schedule.");
  return next;
}
