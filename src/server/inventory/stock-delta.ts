import type { DbClient } from "@/server/db/types";

import { ActionError } from "@/lib/server/action-guard";

/**
 * Atomically changes `Part.currentQty` by `delta` (negative = outbound).
 * Decrements use `updateMany` with `currentQty >= needed` so concurrent usage cannot oversell.
 */
export async function applyStockDelta(tx: DbClient, partId: string, delta: number): Promise<void> {
  if (delta === 0) return;

  if (delta > 0) {
    await tx.part.update({
      where: { id: partId },
      data: { currentQty: { increment: delta } },
    });
    return;
  }

  const need = -delta;
  const { count } = await tx.part.updateMany({
    where: { id: partId, currentQty: { gte: need } },
    data: { currentQty: { decrement: need } },
  });

  if (count === 0) {
    const part = await tx.part.findUnique({
      where: { id: partId },
      select: { name: true, currentQty: true },
    });
    const label = part?.name ?? "部品";
    const onHand = part?.currentQty ?? 0;
    throw new ActionError(`在庫不足: ${label}（現在 ${onHand}）`);
  }
}

/** Recompute `currentQty` from ledger sum (repair drift or admin sanity). */
export async function syncPartQtyFromLedger(tx: DbClient, partId: string): Promise<void> {
  const agg = await tx.inventoryLog.aggregate({
    where: { partId },
    _sum: { quantity: true },
  });
  const sum = agg._sum.quantity ?? 0;
  await tx.part.update({
    where: { id: partId },
    data: { currentQty: sum },
  });
}
