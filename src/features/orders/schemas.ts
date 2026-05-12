import { z } from "zod";

export const orderHeaderSchema = z.object({
  supplierName: z.string().optional(),
  memo: z.string().optional(),
  documentType: z.enum(["PURCHASE_ORDER", "QUOTE_REQUEST"]).optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
});

export const orderLineAppendSchema = z
  .object({
    orderId: z.string().min(1),
    lineMode: z.enum(["MASTER", "FREE_TEXT"]),
    partId: z.string().optional(),
    orderedQty: z.coerce.number().int().positive(),
    unitCost: z.string().optional(),
    freeItemName: z.string().optional(),
    freePartNo: z.string().optional(),
    machineModel: z.string().optional(),
    machineUnitNo: z.string().optional(),
    machineEngineNo: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.lineMode === "MASTER" && (!val.partId || val.partId.trim() === "")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "部品を選択してください" });
    }
    if (val.lineMode === "FREE_TEXT" && (!val.freeItemName || val.freeItemName.trim() === "")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "品名を入力してください" });
    }
  });

/** @deprecated use orderLineAppendSchema */
export const orderLineSchema = orderLineAppendSchema;

export const receiveLineSchema = z.object({
  orderLineId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
});

export const orderHeaderUpdateSchema = z.object({
  orderId: z.string().min(1),
  supplierName: z.string().optional(),
  memo: z.string().optional(),
  documentType: z.enum(["PURCHASE_ORDER", "QUOTE_REQUEST"]).optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  quoteReplyAmount: z.string().optional(),
  quoteReplyLeadTime: z.string().optional(),
});

export const orderLineUpdateSchema = z.object({
  orderLineId: z.string().min(1),
  orderedQty: z.coerce.number().int().positive(),
  unitCost: z.string().optional(),
});

export const orderLineIdSchema = z.object({
  orderLineId: z.string().min(1),
});
