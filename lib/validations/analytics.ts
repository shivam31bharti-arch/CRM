// Zod schema for analytics date filtering.
import { z } from "zod";

export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  export: z.enum(["csv"]).optional()
});
