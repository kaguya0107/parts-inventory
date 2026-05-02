import { z } from "zod";

export const outgoingLineSchema = z.object({
  partId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
});

export const outgoingFormSchema = z.object({
  issueDate: z.string().optional(),
  customerId: z.string().optional(),
  machineId: z.string().optional(),
  memo: z.string().optional(),
  lines: z.array(outgoingLineSchema).min(1, "最低1明細が必要です"),
});

export type OutgoingFormValues = z.infer<typeof outgoingFormSchema>;
