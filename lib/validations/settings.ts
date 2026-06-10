// Zod schemas for profile, integrations, webhooks, and API keys.
import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  password: z.string().min(8).optional().or(z.literal(""))
});

export const webhookSchema = z.object({
  url: z.string().url(),
  eventTypes: z.array(z.string()).min(1)
});
