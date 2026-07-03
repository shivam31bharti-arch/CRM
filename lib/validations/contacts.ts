// Zod schemas for contact CRUD, filters, and CSV import rows.
import { ContactStatus } from "@prisma/client";
import { z } from "zod";

const optionalText = (maximum: number) => z.string().trim().max(maximum).optional();

export const contactImportRowSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(320).or(z.literal("")).optional(),
  phone: optionalText(50),
  company: optionalText(160)
});

export const contactSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required.").max(80),
    lastName: z.string().trim().min(1, "Last name is required.").max(80),
    email: z.string().trim().email().max(320).optional().or(z.literal("")),
    phone: optionalText(50),
    company: optionalText(160),
    companyId: z.string().min(1).optional().nullable(),
    jobTitle: optionalText(120),
    website: z.string().trim().url().max(2048).optional().or(z.literal("")),
    status: z.nativeEnum(ContactStatus).default(ContactStatus.LEAD),
    source: optionalText(120),
    assignedToId: z.string().min(1).optional().nullable(),
    tags: z
      .array(
        z
          .object({
            name: z.string().trim().min(1).max(60),
            color: z
              .string()
              .regex(/^#[0-9a-fA-F]{6}$/)
              .default("#6366f1")
          })
          .strict()
      )
      .max(50)
      .default([]),
    customFields: z.record(z.string().max(2000)).optional()
  })
  .strict();

export const contactCreateSchema = contactSchema.extend({
  allowDuplicate: z.boolean().default(false)
});

export const contactQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  status: z.nativeEnum(ContactStatus).optional(),
  sort: z.string().default("createdAt"),
  direction: z.enum(["asc", "desc"]).default("desc")
});
