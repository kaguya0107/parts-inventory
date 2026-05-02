"use server";

import { revalidatePath } from "next/cache";

import * as UsageHistoryService from "@/server/services/usage-history.service";

import { outgoingFormSchema } from "@/features/outgoing/schemas";
import {
  guardAction,
  parseForm,
  requireUser,
  ActionError,
} from "@/lib/server/action-guard";

export async function createOutgoingIssue(formData: FormData) {
  return guardAction(async () => {
    await requireUser();

    const entries = Object.fromEntries(formData.entries());
    const linesRaw = entries.lines;

    let linesUnknown: unknown;
    if (typeof linesRaw !== "string") {
      throw new ActionError("明細情報が送信されていません");
    }
    try {
      linesUnknown = JSON.parse(linesRaw);
    } catch {
      throw new ActionError("明細データが壊れています（再入力してください）");
    }

    const parsed = parseForm(outgoingFormSchema, {
      ...entries,
      lines: linesUnknown,
    });

    await UsageHistoryService.createUsageSlip({
      issueDate: parsed.issueDate ? new Date(parsed.issueDate) : new Date(),
      customerId: parsed.customerId?.trim() ? parsed.customerId : undefined,
      machineId: parsed.machineId?.trim() ? parsed.machineId : undefined,
      memo: parsed.memo?.trim() ? parsed.memo.trim() : undefined,
      lines: parsed.lines,
    });

    revalidatePath("/dashboard/outgoing");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/parts");
  });
}
