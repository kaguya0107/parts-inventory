import Link from "next/link";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import {
  RepairsDataTable,
  type RepairTableRow,
} from "@/components/repairs/repairs-data-table";
import { jpDateLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export default async function RepairsPage() {
  const records = await prisma.repairHistory.findMany({
    orderBy: { repairDate: "desc" },
    take: 250,
  });

  const rows: RepairTableRow[] = records.map((r) => ({
    id: r.id,
    repairDateSort: r.repairDate.toISOString(),
    repairDateDisplay: jpDateLabel(r.repairDate),
    title: r.title,
    fileName: r.fileName,
  }));

  return (
    <div className="flex min-h-[70vh] flex-1 flex-col">
      <DashboardHeader
        title="修理履歴"
        description="PDF をファイルとして保管します。一覧は並べ替えと絞り込みができます。"
        actions={
          <Button size="sm" className="shadow-inner shadow-white/65" asChild>
            <Link href="/dashboard/repairs/new">PDF アップロード</Link>
          </Button>
        }
      />

      <MotionFade className="flex flex-col gap-5 px-5 py-8 sm:px-8">
        <RepairsDataTable data={rows} />

        {!rows.length ? <p className="text-[13px] text-muted-foreground">データがありません。PDF を追加してください。</p> : null}
      </MotionFade>
    </div>
  );
}
