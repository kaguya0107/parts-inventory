import type { Prisma } from "@prisma/client";

import type { DbClient } from "@/server/db/types";
import { applyStockDelta } from "@/server/inventory/stock-delta";

import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/server/action-guard";
import { orderLineStatusFromQuantities, orderProgressStatus } from "@/lib/domain/inventory";

/**
 * Purchase **receipt** is the only path that increases on-hand stock (incoming):
 * we append a `PURCHASE_IN` ledger row (positive `quantity`) and bump `Part.currentQty`
 * in the same transaction. Placing an order alone does not change stock.
 */

export async function createOrderHeader(input: {
  supplierName?: string;
  memo?: string;
}): Promise<{ id: string }> {
  const order = await prisma.order.create({
    data: {
      supplierName: input.supplierName?.trim() || undefined,
      memo: input.memo?.trim() || undefined,
    },
  });
  return { id: order.id };
}

export async function appendOrderLine(input: {
  orderId: string;
  partId: string;
  orderedQty: number;
  unitCost?: Prisma.Decimal | null;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const parent = await tx.order.findUnique({ where: { id: input.orderId } });

    if (!parent || parent.status === "CANCELLED") {
      throw new ActionError("注文が見つからないか取り消されています");
    }

    await tx.orderLine.create({
      data: {
        orderId: input.orderId,
        partId: input.partId,
        orderedQty: input.orderedQty,
        unitCost: input.unitCost ?? undefined,
      },
    });

    const lines = await tx.orderLine.findMany({ where: { orderId: input.orderId } });
    await tx.order.update({
      where: { id: input.orderId },
      data: { status: orderProgressStatus(lines) },
    });
  });
}

export async function receiveOrderLineTx(tx: DbClient, input: { orderLineId: string; quantity: number }): Promise<{ orderId: string }> {
  const line = await tx.orderLine.findUnique({
    where: { id: input.orderLineId },
    include: { order: true },
  });

  if (!line || line.order.status === "CANCELLED") {
    throw new ActionError("明細が見つかりません");
  }

  const remaining = line.orderedQty - line.receivedQty;
  if (input.quantity > remaining) {
    throw new ActionError("入荷数量が発注残を超えています");
  }

  // Immutable ledger row + cached qty update — same transaction (all-or-nothing).
  await tx.inventoryLog.create({
    data: {
      partId: line.partId,
      logType: "PURCHASE_IN",
      quantity: input.quantity,
      orderLineId: line.id,
    },
  });

  await applyStockDelta(tx, line.partId, input.quantity);

  const newReceived = line.receivedQty + input.quantity;

  await tx.orderLine.update({
    where: { id: line.id },
    data: {
      receivedQty: newReceived,
      lineStatus: orderLineStatusFromQuantities(line.orderedQty, newReceived),
    },
  });

  const lines = await tx.orderLine.findMany({ where: { orderId: line.orderId } });
  await tx.order.update({
    where: { id: line.orderId },
    data: { status: orderProgressStatus(lines) },
  });

  return { orderId: line.orderId };
}

export async function receiveOrderLine(input: { orderLineId: string; quantity: number }): Promise<{ orderId: string }> {
  return prisma.$transaction((tx) => receiveOrderLineTx(tx, input));
}

export async function cancelOrder(orderId: string): Promise<void> {
  const ord = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lines: true },
  });

  if (!ord) throw new ActionError("注文が見つかりません");
  const hasRecv = ord.lines.some((l) => l.receivedQty > 0);
  if (hasRecv) throw new ActionError("すでに入荷がある注文は取り消せません");

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });
}

export async function updateOrderHeader(input: {
  orderId: string;
  supplierName?: string;
  memo?: string;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const ord = await tx.order.findUnique({ where: { id: input.orderId } });
    if (!ord) throw new ActionError("注文が見つかりません");
    if (ord.status === "CANCELLED") throw new ActionError("取消済みの注文は変更できません");

    await tx.order.update({
      where: { id: input.orderId },
      data: {
        supplierName: input.supplierName?.trim() || undefined,
        memo: input.memo?.trim() || undefined,
      },
    });
  });
}

export async function deleteOrderLine(orderLineId: string): Promise<{ orderId: string }> {
  return prisma.$transaction(async (tx) => {
    const line = await tx.orderLine.findUnique({
      where: { id: orderLineId },
      include: { order: true },
    });
    if (!line) throw new ActionError("明細が見つかりません");
    if (line.order.status === "CANCELLED") throw new ActionError("取消済みの注文です");

    if (line.receivedQty > 0) {
      throw new ActionError("入荷済みの明細は削除できません");
    }

    const orderId = line.orderId;
    await tx.orderLine.delete({ where: { id: orderLineId } });

    const lines = await tx.orderLine.findMany({ where: { orderId } });
    await tx.order.update({
      where: { id: orderId },
      data: { status: orderProgressStatus(lines) },
    });

    return { orderId };
  });
}

export async function listOrdersForDashboard(take = 200) {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      _count: { select: { lines: true } },
    },
  });
}

export async function getOrderWithLines(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      lines: { include: { part: true }, orderBy: { createdAt: "asc" } },
    },
  });
}

export async function updateOrderLine(input: {
  orderLineId: string;
  orderedQty: number;
  unitCost?: Prisma.Decimal | null;
}): Promise<{ orderId: string }> {
  return prisma.$transaction(async (tx) => {
    const line = await tx.orderLine.findUnique({
      where: { id: input.orderLineId },
      include: { order: true },
    });
    if (!line) throw new ActionError("明細が見つかりません");
    if (line.order.status === "CANCELLED") throw new ActionError("取消済みの注文です");

    if (input.orderedQty < line.receivedQty) {
      throw new ActionError("発注数量は入荷済み数量以上にしてください");
    }

    await tx.orderLine.update({
      where: { id: input.orderLineId },
      data: {
        orderedQty: input.orderedQty,
        lineStatus: orderLineStatusFromQuantities(input.orderedQty, line.receivedQty),
        ...(input.unitCost === undefined ? {} : { unitCost: input.unitCost }),
      },
    });

    const lines = await tx.orderLine.findMany({ where: { orderId: line.orderId } });
    await tx.order.update({
      where: { id: line.orderId },
      data: { status: orderProgressStatus(lines) },
    });

    return { orderId: line.orderId };
  });
}
