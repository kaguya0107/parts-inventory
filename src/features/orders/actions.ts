"use server";

import { revalidatePath } from "next/cache";

import * as OrdersService from "@/server/services/orders.service";

import {
  orderHeaderSchema,
  orderHeaderUpdateSchema,
  orderLineSchema,
  orderLineUpdateSchema,
  orderLineIdSchema,
  receiveLineSchema,
} from "@/features/orders/schemas";
import {
  parseForm,
  guardAction,
  requireUser,
  type ActionResult,
} from "@/lib/server/action-guard";
import { toOptionalDecimal } from "@/lib/decimal";

export async function createOrderHeader(formData: FormData): Promise<ActionResult<{ id: string }>> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(orderHeaderSchema, Object.fromEntries(formData.entries()));

    const row = await OrdersService.createOrderHeader({
      supplierName: parsed.supplierName?.trim() || undefined,
      memo: parsed.memo?.trim() || undefined,
    });

    revalidatePath("/dashboard/orders");
    return { id: row.id };
  });
}

export async function updateOrderHeader(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(orderHeaderUpdateSchema, Object.fromEntries(formData.entries()));

    await OrdersService.updateOrderHeader({
      orderId: parsed.orderId,
      supplierName: parsed.supplierName,
      memo: parsed.memo,
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${parsed.orderId}`);
  });
}

export async function appendOrderLine(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(orderLineSchema, Object.fromEntries(formData.entries()));

    await OrdersService.appendOrderLine({
      orderId: parsed.orderId,
      partId: parsed.partId,
      orderedQty: parsed.orderedQty,
      unitCost: toOptionalDecimal(parsed.unitCost ?? undefined),
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${parsed.orderId}`);
  });
}

export async function receiveOrderLine(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(receiveLineSchema, Object.fromEntries(formData.entries()));

    const { orderId } = await OrdersService.receiveOrderLine({
      orderLineId: parsed.orderLineId,
      quantity: parsed.quantity,
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/parts");
  });
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    await OrdersService.cancelOrder(orderId);

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
  });
}

export async function deleteOrderLine(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(orderLineIdSchema, Object.fromEntries(formData.entries()));

    const { orderId } = await OrdersService.deleteOrderLine(parsed.orderLineId);

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
  });
}

export async function updateOrderLine(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(orderLineUpdateSchema, Object.fromEntries(formData.entries()));

    const { orderId } = await OrdersService.updateOrderLine({
      orderLineId: parsed.orderLineId,
      orderedQty: parsed.orderedQty,
      unitCost: toOptionalDecimal(parsed.unitCost ?? undefined),
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
  });
}
