import { z } from "zod";

const optionalText = (maximum: number) => z.string().trim().max(maximum).optional();

export const companySchema = z
  .object({
    name: z.string().trim().min(1, "Company name is required.").max(160),
    website: z.string().trim().url().max(2048).or(z.literal("")).optional(),
    industry: optionalText(120),
    phone: optionalText(50),
    description: optionalText(2000),
    ownerId: z.string().min(1).optional().nullable()
  })
  .strict();

export const companyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().min(1).optional(),
  sort: z.enum(["name", "createdAt", "updatedAt"]).default("createdAt"),
  direction: z.enum(["asc", "desc"]).default("desc")
});
