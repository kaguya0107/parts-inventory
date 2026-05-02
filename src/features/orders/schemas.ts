import { z } from "zod";

export const orderHeaderSchema = z.object({
  supplierName: z.string().optional(),
  memo: z.string().optional(),
});

export const orderLineSchema = z.object({
  orderId: z.string().min(1),
  partId: z.string().min(1),
  orderedQty: z.coerce.number().int().positive(),
  unitCost: z.string().optional(),
});

export const receiveLineSchema = z.object({
  orderLineId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
});

export const orderHeaderUpdateSchema = z.object({
  orderId: z.string().min(1),
  supplierName: z.string().optional(),
  memo: z.string().optional(),
});

export const orderLineUpdateSchema = z.object({
  orderLineId: z.string().min(1),
  orderedQty: z.coerce.number().int().positive(),
  unitCost: z.string().optional(),
});

export const orderLineIdSchema = z.object({
  orderLineId: z.string().min(1),
});
