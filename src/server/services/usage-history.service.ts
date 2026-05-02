import { listCustomersAlphabetical } from "@/server/services/customers.service";
import { listMachinesForOutgoing } from "@/server/services/machines.service";
import { listPartsForStockPickers } from "@/server/services/parts.service";

import type { DbClient } from "@/server/db/types";
import { applyStockDelta } from "@/server/inventory/stock-delta";

import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/server/action-guard";

/**
 * Usage (出庫) is the path that decreases stock (outgoing): for each line we insert
 * a `USAGE_OUT` ledger row (negative `quantity`) and apply the matching negative delta
 * to `Part.currentQty` in one transaction (after all lines are created, so the tx
 * rolls back entirely if any quantity check fails).
 */

export type OutgoingLineInput = { partId: string; quantity: number };

export type CreateUsageSlipPayload = {
  issueDate?: Date | null;
  customerId?: string;
  machineId?: string;
  memo?: string;
  lines: OutgoingLineInput[];
};

async function aggregateNeedByPart(lines: OutgoingLineInput[]): Promise<Map<string, number>> {
  const totals = new Map<string, number>();
  for (const line of lines) {
    totals.set(line.partId, (totals.get(line.partId) ?? 0) + line.quantity);
  }
  return totals;
}

export async function createUsageSlipTx(tx: DbClient, payload: CreateUsageSlipPayload): Promise<{ id: string }> {
  const need = await aggregateNeedByPart(payload.lines);

  for (const partId of need.keys()) {
    const part = await tx.part.findUnique({ where: { id: partId } });
    if (!part) throw new ActionError("部品が存在しません");
  }

  const slip = await tx.usageHistory.create({
    data: {
      issueDate: payload.issueDate ?? new Date(),
      customerId: payload.customerId?.trim() ? payload.customerId : undefined,
      machineId: payload.machineId?.trim() ? payload.machineId : undefined,
      memo: payload.memo?.trim() ? payload.memo.trim() : undefined,
    },
  });

  // Record every outbound line in the ledger first; then apply stock decrements.
  // If any decrement fails (e.g. negative stock), the whole transaction aborts — no partial slip.
  for (const line of payload.lines) {
    const created = await tx.usageHistoryLine.create({
      data: {
        usageHistoryId: slip.id,
        partId: line.partId,
        quantity: line.quantity,
      },
    });

    await tx.inventoryLog.create({
      data: {
        partId: line.partId,
        logType: "USAGE_OUT",
        quantity: -line.quantity,
        usageLineId: created.id,
      },
    });
  }

  for (const [partId, total] of need.entries()) {
    await applyStockDelta(tx, partId, -total);
  }

  return { id: slip.id };
}

export async function createUsageSlip(payload: CreateUsageSlipPayload): Promise<{ id: string }> {
  return prisma.$transaction((tx) => createUsageSlipTx(tx, payload));
}

/** Server-composed props for the outgoing issue form (one import site for the page). */
export async function getOutgoingIssueFormData() {
  const [customers, machines, parts] = await Promise.all([
    listCustomersAlphabetical(),
    listMachinesForOutgoing(),
    listPartsForStockPickers(),
  ]);

  return { customers, machines, parts };
}

export async function listUsageHistoriesForDashboard(take = 250) {
  return prisma.usageHistory.findMany({
    orderBy: { issueDate: "desc" },
    take,
    include: {
      customer: true,
      machine: true,
      lines: { include: { part: true }, orderBy: { createdAt: "asc" as const } },
    },
  });
}
