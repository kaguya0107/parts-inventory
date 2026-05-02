import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .transform((s) => (s === undefined ? undefined : s.trim() === "" ? undefined : s.trim()));

export const partFormSchema = z.object({
  name: z.string().min(1, "部品名を入力してください"),
  oemPartNo: optionalText,
  aftermarketNo: optionalText,
  oemListPrice: optionalText,
  purchasePrice: optionalText,
  salePrice: optionalText,
  compatibleModels: z.string().optional(),
  markupRate: optionalText,
});
