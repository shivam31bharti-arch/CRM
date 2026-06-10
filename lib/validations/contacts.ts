// Zod schemas for contact CRUD, filters, and CSV import rows.
import { ContactStatus } from "@prisma/client";
import { z } from "zod";

export const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  status: z.nativeEnum(ContactStatus).default(ContactStatus.LEAD),
  source: z.string().optional(),
  assignedToId: z.string().optional().nullable(),
  tags: z.array(z.object({ name: z.string().min(1), color: z.string().default("#6366f1") })).default([]),
  customFields: z.record(z.string()).optional()
});

export const contactQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  status: z.nativeEnum(ContactStatus).optional(),
  sort: z.string().default("createdAt"),
  direction: z.enum(["asc", "desc"]).default("desc")
});
