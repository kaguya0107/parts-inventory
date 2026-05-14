"use server";

import { revalidatePath } from "next/cache";

import * as OrdersService from "@/server/services/orders.service";

import {
  orderHeaderSchema,
  orderHeaderUpdateSchema,
  orderLineAppendSchema,
  orderLineUpdateSchema,
  orderLineIdSchema,
  receiveLineSchema,
} from "@/features/orders/schemas";
import {
  parseForm,
  guardAction,
  requireUser,
  ActionError,
  type ActionResult,
} from "@/lib/server/action-guard";
import { toOptionalDecimal } from "@/lib/decimal";
import { sendPlainEmail } from "@/lib/mail";
import { orderDocumentTypeLabel } from "@/lib/labels";

export async function createOrderHeader(formData: FormData): Promise<ActionResult<{ id: string }>> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(orderHeaderSchema, Object.fromEntries(formData.entries()));

    const row = await OrdersService.createOrderHeader({
      supplierId: parsed.supplierId?.trim() || null,
      supplierName: parsed.supplierName?.trim() || undefined,
      supplierFax: parsed.supplierFax?.trim() || null,
      supplierHonorific: parsed.supplierHonorific?.trim() || null,
      memo: parsed.memo?.trim() || undefined,
      documentType: parsed.documentType,
      contactName: parsed.contactName?.trim() || undefined,
      contactPhone: parsed.contactPhone?.trim() || undefined,
      contactEmail: parsed.contactEmail?.trim() || undefined,
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
      supplierId: parsed.supplierId !== undefined ? parsed.supplierId.trim() || null : undefined,
      supplierName: parsed.supplierName,
      supplierFax:
        parsed.supplierFax !== undefined ? parsed.supplierFax.trim() || null : undefined,
      supplierHonorific:
        parsed.supplierHonorific !== undefined
          ? parsed.supplierHonorific.trim() || null
          : undefined,
      memo: parsed.memo,
      documentType: parsed.documentType,
      contactName: parsed.contactName,
      contactPhone: parsed.contactPhone,
      contactEmail: parsed.contactEmail,
      quoteReplyAmount:
        parsed.quoteReplyAmount?.trim() === ""
          ? null
          : toOptionalDecimal(parsed.quoteReplyAmount ?? undefined),
      quoteReplyLeadTime: parsed.quoteReplyLeadTime?.trim() || null,
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${parsed.orderId}`);
    revalidatePath(`/dashboard/orders/${parsed.orderId}/print`);
  });
}

export async function appendOrderLine(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(orderLineAppendSchema, Object.fromEntries(formData.entries()));

    await OrdersService.appendOrderLine({
      orderId: parsed.orderId,
      lineMode: parsed.lineMode,
      partId: parsed.partId?.trim() || undefined,
      orderedQty: parsed.orderedQty,
      unitCost: toOptionalDecimal(parsed.unitCost ?? undefined),
      freeItemName: parsed.freeItemName,
      freePartNo: parsed.freePartNo,
      machineModel: parsed.machineModel,
      machineUnitNo: parsed.machineUnitNo,
      machineEngineNo: parsed.machineEngineNo,
      lineNote: parsed.lineNote !== undefined ? parsed.lineNote.trim() || null : undefined,
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${parsed.orderId}`);
    revalidatePath(`/dashboard/orders/${parsed.orderId}/print`);
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
    revalidatePath(`/dashboard/orders/${orderId}/print`);
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
    revalidatePath(`/dashboard/orders/${orderId}/print`);
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
      lineNote: parsed.lineNote !== undefined ? parsed.lineNote.trim() || null : undefined,
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath(`/dashboard/orders/${orderId}/print`);
  });
}

/** メール本文に印刷用URLを記載（Resend 要設定） */
export async function sendOrderShareEmail(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const orderId = String(formData.get("orderId") ?? "").trim();
    const toOverride = String(formData.get("to") ?? "").trim();
    if (!orderId) throw new ActionError("注文が指定されていません");

    const order = await OrdersService.getOrderWithLines(orderId);
    if (!order) throw new ActionError("注文が見つかりません");

    const to = toOverride || order.contactEmail?.trim();
    if (!to) throw new ActionError("送信先メールが未入力です（ヘッダの担当メールを入力するか、下欄に直接入力）。");

    const origin = process.env.AUTH_URL?.replace(/\/$/, "") ?? "";
    const printPath = `/dashboard/orders/${orderId}/print`;
    const printUrl = origin ? `${origin}${printPath}` : printPath;

    const text = [
      "注文書／見積文書の共有",
      "",
      `書類種別: ${orderDocumentTypeLabel[order.documentType]}`,
      `発注先: ${order.supplierName ?? "—"}`,
      `注文日: ${order.orderDate.toISOString().slice(0, 10)}`,
      "",
      "ブラウザで開き、印刷（またはPDF保存）できます:",
      printUrl,
      "",
      "---",
      order.memo ?? "",
    ].join("\n");

    const sent = await sendPlainEmail({
      to,
      subject: `【共有】${orderDocumentTypeLabel[order.documentType]}（${order.supplierName ?? "未記入"}）`,
      text,
    });

    if (!sent.ok) throw new ActionError(sent.message);
    revalidatePath(`/dashboard/orders/${orderId}`);
  });
}
