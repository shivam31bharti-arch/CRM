// Zod schemas for campaign manager APIs.
import { CampaignStatus } from "@prisma/client";
import { z } from "zod";

export const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required."),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(CampaignStatus).default(CampaignStatus.DRAFT),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable()
});

export const campaignLinkSchema = z.object({
  id: z.string().min(1)
});
