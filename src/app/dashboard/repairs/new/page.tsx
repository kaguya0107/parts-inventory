import Link from "next/link";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import { RepairPdfForm, type RepairMachineOption } from "@/components/repairs/repair-pdf-form";
import { prisma } from "@/lib/db";

type SearchShape = Record<string, string | string[] | undefined>;

export default async function RepairNewPage(props: { searchParams: Promise<SearchShape> }) {
  const params = await props.searchParams;
  const preRaw = typeof params.machineId === "string" ? params.machineId : undefined;

  const machineRows = await prisma.machine.findMany({
    orderBy: [{ customer: { name: "asc" } }, { modelName: "asc" }, { unitNo: "asc" }],
    include: { customer: true },
    take: 1500,
  });

  const machines: RepairMachineOption[] = machineRows.map((m) => ({
    id: m.id,
    label: `${m.customer.name} / ${m.modelName} / ${m.unitNo}`,
  }));

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <DashboardHeader
        title="修理履歴（PDF登録）"
        description="保有機を選ぶと、その機械からも履歴を追いやすくなります（任意）。"
      />
      <MotionFade className="flex flex-1 flex-col gap-6 px-8 py-6">
        <RepairPdfForm machines={machines} initialMachineId={preRaw} />
        <Link className="text-sm text-muted-foreground underline" href="/dashboard/repairs">
          一覧へ戻る
        </Link>
      </MotionFade>
    </div>
  );
}
