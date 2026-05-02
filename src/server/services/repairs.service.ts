import { unlink } from "fs/promises";
import path from "path";

import { prisma } from "@/lib/db";
import { getUploadRoot } from "@/lib/storage/local";
import { ActionError } from "@/lib/server/action-guard";

export async function createRepairPdfRecord(input: {
  title: string;
  repairDate: Date;
  storedFileKey: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  machineId?: string | null;
}): Promise<{ id: string; pdfUrl: string }> {
  return prisma.$transaction(async (tx) => {
    if (input.machineId?.trim()) {
      const m = await tx.machine.findUnique({ where: { id: input.machineId.trim() } });
      if (!m) throw new ActionError("選択した保有機が見つかりません");
    }

    const row = await tx.repairHistory.create({
      data: {
        title: input.title,
        repairDate: input.repairDate,
        storedFileKey: input.storedFileKey,
        mimeType: input.mimeType ?? "application/pdf",
        fileName: input.fileName,
        fileSize: input.fileSize,
        machineId: input.machineId?.trim() ? input.machineId.trim() : undefined,
      },
    });

    const pdfUrl = `/api/repairs/${row.id}/file`;

    await tx.repairHistory.update({
      where: { id: row.id },
      data: { pdfUrl },
    });

    return { id: row.id, pdfUrl };
  });
}

export async function deleteRepairRecord(recordId: string): Promise<{ machineId: string | null }> {
  const record = await prisma.repairHistory.findUnique({ where: { id: recordId } });
  if (!record) throw new ActionError("ファイルが見つかりません");

  const abs = path.join(getUploadRoot(), record.storedFileKey);

  try {
    await unlink(abs);
  } catch {
    /* ignore missing file */
  }

  const machineId = record.machineId;
  await prisma.repairHistory.delete({ where: { id: recordId } });
  return { machineId };
}

export type RepairHistoryListParams = {
  machineId?: string;
  take?: number;
};

/** Dashboard list with optional machine filter (for search / machine detail context). */
export async function listRepairHistories(params: RepairHistoryListParams = {}) {
  const take = params.take ?? 250;
  const machineId = params.machineId?.trim();

  return prisma.repairHistory.findMany({
    where: machineId ? { machineId } : undefined,
    orderBy: { repairDate: "desc" },
    take,
    include: {
      machine: { include: { customer: true } },
    },
  });
}
