import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/server/action-guard";

export async function createMachine(input: {
  customerId: string;
  modelName: string;
  unitNo: string;
  engineNo?: string | null;
}) {
  return prisma.machine.create({
    data: {
      customerId: input.customerId,
      modelName: input.modelName,
      unitNo: input.unitNo,
      engineNo: input.engineNo?.trim() ? input.engineNo.trim() : undefined,
    },
  });
}

export async function updateMachine(
  machineId: string,
  input: {
    modelName: string;
    unitNo: string;
    engineNo?: string | null;
    customerId?: string;
  },
): Promise<void> {
  await prisma.machine.update({
    where: { id: machineId },
    data: {
      modelName: input.modelName,
      unitNo: input.unitNo,
      engineNo: input.engineNo?.trim() ? input.engineNo.trim() : undefined,
      ...(input.customerId ? { customerId: input.customerId } : {}),
    },
  });
}

export async function deleteMachine(machineId: string): Promise<void> {
  const refs = await prisma.usageHistory.count({ where: { machineId } });
  if (refs > 0) throw new ActionError("出庫で利用された機番は削除できません");

  await prisma.machine.delete({ where: { id: machineId } });
}
