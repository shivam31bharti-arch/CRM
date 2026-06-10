// Zod schemas for inbox filters, replies, and contact linking.
import { InboxType, Platform } from "@prisma/client";
import { z } from "zod";

export const inboxQuerySchema = z.object({
  platform: z.nativeEnum(Platform).optional(),
  type: z.nativeEnum(InboxType).optional(),
  read: z.enum(["true", "false"]).optional()
});

export const replySchema = z.object({
  replyBody: z.string().min(1, "Reply cannot be empty.")
});

export const linkContactSchema = z.object({
  contactId: z.string().min(1)
});
