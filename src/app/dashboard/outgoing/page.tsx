import Link from "next/link";

import { OutgoingFilteredBoard, type OutgoingSlipSerialized } from "@/components/outgoing/outgoing-filtered-board";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import { Button } from "@/components/ui/button";
import { listUsageHistoriesForDashboard } from "@/server/services/usage-history.service";

export default async function OutgoingListPage() {
  const slipsRaw = await listUsageHistoriesForDashboard(250);

  const slips: OutgoingSlipSerialized[] = slipsRaw.map((slip) => ({
    id: slip.id,
    issueDate: slip.issueDate.toISOString(),
    memo: slip.memo,
    customerName: slip.customer?.name ?? "無記名",
    municipalityLabel: slip.customer?.municipality ?? "—",
    machineLabel:
      slip.machine && slip.machine.modelName ? `${slip.machine.modelName} #${slip.machine.unitNo}` : "保有機情報なし",
    lines: slip.lines.map((line) => ({
      id: line.id,
      partName: line.part.name,
      quantity: line.quantity,
    })),
  }));

  return (
    <div className="flex min-h-[70vh] flex-1 flex-col">
      <DashboardHeader
        title="出庫（使用）"
        description="顧客・機番との紐付けでトレースしやすく。カード一覧は並び順を保ちつつ、この画面だけで細かく絞り込めます。"
        actions={
          <Button size="sm" className="shadow-inner shadow-white/70" asChild>
            <Link href="/dashboard/outgoing/new">新規出庫</Link>
          </Button>
        }
      />
      <MotionFade className="flex flex-1 flex-col gap-2 px-5 py-6 sm:px-8">
        <OutgoingFilteredBoard slips={slips} />
      </MotionFade>
    </div>
  );
}
