"use server";

import { revalidatePath } from "next/cache";

import * as RepairsService from "@/server/services/repairs.service";

import { guardAction, requireUser, type ActionResult } from "@/lib/server/action-guard";

export async function deleteRepairRecord(recordId: string): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();

    await RepairsService.deleteRepairRecord(recordId);

    revalidatePath("/dashboard/repairs");
  });
}
