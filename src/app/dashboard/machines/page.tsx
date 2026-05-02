import Link from "next/link";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import {
  MachinesDataTable,
  MachineCreateDialog,
  type MachineTableRow,
} from "@/components/machines/machines-data-table";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export default async function MachinesPage() {
  const [customers, machines] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" }, take: 600 }),
    prisma.machine.findMany({
      orderBy: { modelName: "asc" },
      include: { customer: true },
      take: 1000,
    }),
  ]);

  const tableRows: MachineTableRow[] = machines.map((m) => ({
    id: m.id,
    customerName: m.customer.name,
    municipality: m.customer.municipality,
    modelName: m.modelName,
    unitNo: m.unitNo,
    engineNo: m.engineNo ?? "—",
  }));

  return (
    <div className="flex min-h-[70vh] flex-1 flex-col">
      <DashboardHeader
        title="保有機"
        description="全顧客の保有機一覧。テーブルをソート・検索できます。重複しないよう型式／号機の組み合わせが制約されています。"
        actions={
          <div className="flex flex-wrap gap-2">
            <MachineCreateDialog customers={customers} />
            <Button variant="outline" size="sm" asChild className="shadow-inner shadow-indigo-100/35">
              <Link href="/dashboard/customers">顧客マスタへ</Link>
            </Button>
          </div>
        }
      />

      <MotionFade className="flex flex-col gap-6 px-5 py-8 sm:px-8">
        <MachinesDataTable data={tableRows} />
      </MotionFade>
    </div>
  );
}
