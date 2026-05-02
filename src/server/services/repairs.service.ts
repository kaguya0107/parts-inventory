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
}): Promise<{ id: string; pdfUrl: string }> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.repairHistory.create({
      data: {
        title: input.title,
        repairDate: input.repairDate,
        storedFileKey: input.storedFileKey,
        mimeType: input.mimeType ?? "application/pdf",
        fileName: input.fileName,
        fileSize: input.fileSize,
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

export async function deleteRepairRecord(recordId: string): Promise<void> {
  const record = await prisma.repairHistory.findUnique({ where: { id: recordId } });
  if (!record) throw new ActionError("ファイルが見つかりません");

  const abs = path.join(getUploadRoot(), record.storedFileKey);

  try {
    await unlink(abs);
  } catch {
    /* ignore missing file */
  }

  await prisma.repairHistory.delete({ where: { id: recordId } });
}
