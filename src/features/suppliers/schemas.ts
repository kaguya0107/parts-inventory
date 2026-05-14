import { z } from "zod";

export const supplierCreateSchema = z.object({
  companyName: z.string().min(1, "会社名を入力してください"),
  attn: z.string().optional(),
  fax: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  memo: z.string().optional(),
});

export const supplierUpdateSchema = supplierCreateSchema.extend({
  id: z.string().min(1),
});

export const supplierIdSchema = z.object({
  id: z.string().min(1),
});
