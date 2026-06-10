// Zod schemas for deal records and pipeline stage changes.
import { DealStage } from "@prisma/client";
import { z } from "zod";

export const dealSchema = z.object({
  title: z.string().min(1, "Title is required."),
  value: z.coerce.number().min(0).default(0),
  currency: z.string().length(3).default("USD"),
  stage: z.nativeEnum(DealStage).default(DealStage.LEAD),
  probability: z.coerce.number().int().min(0).max(100).default(0),
  closeDate: z.string().datetime().optional().nullable(),
  description: z.string().optional(),
  contactId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  lostReason: z.string().optional().nullable()
});

export const stageChangeSchema = z.object({
  stage: z.nativeEnum(DealStage),
  lostReason: z.string().optional()
});
