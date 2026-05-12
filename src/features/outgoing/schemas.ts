import { z } from "zod";

export const outgoingLineSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("master"),
    partId: z.string().min(1),
    quantity: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal("adHoc"),
    quantity: z.number().int().positive(),
    itemName: z.string().min(1),
    partNo: z.string().optional(),
    machineModel: z.string().optional(),
    machineUnitNo: z.string().optional(),
    machineEngineNo: z.string().optional(),
  }),
]);

export const outgoingFormSchema = z.object({
  issueDate: z.string().optional(),
  customerId: z.string().optional(),
  machineId: z.string().optional(),
  memo: z.string().optional(),
  lines: z.array(outgoingLineSchema).min(1, "最低1明細が必要です"),
});

export type OutgoingFormValues = z.infer<typeof outgoingFormSchema>;
