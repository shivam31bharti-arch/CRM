// Zod schemas for team invites and role changes.
import { Role } from "@prisma/client";
import { z } from "zod";

export const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.nativeEnum(Role).default(Role.MEMBER)
});

export const roleSchema = z.object({
  role: z.nativeEnum(Role)
});
