import type { Prisma } from "@prisma/client";

import type { DbClient } from "@/server/db/types";
import { applyStockDelta } from "@/server/inventory/stock-delta";

import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/server/action-guard";

export type PartWriteInput = {
  name: string;
  oemPartNo?: string;
  aftermarketNo?: string;
  oemListPrice?: Prisma.Decimal | null;
  purchasePrice?: Prisma.Decimal | null;
  salePrice?: Prisma.Decimal | null;
  compatibleModels?: string;
  markupRate?: Prisma.Decimal | null;
};

export type PartCreatePayload = PartWriteInput & { initialQty: number };

export type PartUpdatePayload = PartWriteInput & { targetQty: number };

export async function createPartTx(tx: DbClient, payload: PartCreatePayload): Promise<{ id: string }> {
  const { initialQty, ...meta } = payload;

  const row = await tx.part.create({
    data: {
      ...meta,
      currentQty: 0,
    },
  });

  if (initialQty > 0) {
    await tx.inventoryLog.create({
      data: {
        partId: row.id,
        logType: "ADJUSTMENT",
        quantity: initialQty,
        note: "初期残高（新規部品登録）",
      },
    });
    await applyStockDelta(tx, row.id, initialQty);
  }

  return { id: row.id };
}

export async function createPart(payload: PartCreatePayload): Promise<{ id: string }> {
  return prisma.$transaction((tx) => createPartTx(tx, payload));
}

export async function updatePartTx(
  tx: DbClient,
  partId: string,
  prevQty: number,
  payload: PartUpdatePayload,
): Promise<void> {
  const { targetQty, ...meta } = payload;
  const delta = targetQty - prevQty;

  await tx.part.update({
    where: { id: partId },
    data: meta,
  });

  if (delta !== 0) {
    await tx.inventoryLog.create({
      data: {
        partId,
        logType: "ADJUSTMENT",
        quantity: delta,
        note: "マスタ画面上で在庫数を修正しました",
      },
    });
    await applyStockDelta(tx, partId, delta);
  }
}

export async function updatePart(partId: string, prevQty: number, payload: PartUpdatePayload): Promise<void> {
  return prisma.$transaction((tx) => updatePartTx(tx, partId, prevQty, payload));
}

export async function deletePartTx(tx: DbClient, partId: string): Promise<void> {
  await tx.inventoryLog.deleteMany({ where: { partId } });
  await tx.part.delete({ where: { id: partId } });
}

export async function deletePart(partId: string): Promise<void> {
  const orders = await prisma.orderLine.count({ where: { partId } });
  const usageLines = await prisma.usageHistoryLine.count({ where: { partId } });
  if (orders + usageLines > 0) {
    throw new ActionError("注文または出庫で利用されている部品は削除できません");
  }

  await prisma.$transaction((tx) => deletePartTx(tx, partId));
}
