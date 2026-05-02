import Link from "next/link";

import { CustomerCreateDialog } from "@/components/customers/customer-create-dialog";
import { CustomersDataTable, type CustomerTableRow } from "@/components/customers/customers-data-table";
import { CustomerQuickForm } from "@/components/customers/customer-quick-form";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export default async function CustomersPage() {
  const rows = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { machines: true } },
    },
    take: 500,
  });

  const tableRows: CustomerTableRow[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    municipality: c.municipality,
    machineCount: c._count.machines,
  }));

  return (
    <div className="flex min-h-[70vh] flex-1 flex-col">
      <DashboardHeader
        title="顧客"
        description="名称・所在地のみのシンプルな顧客台帳です。一覧はソートとクイック検索が可能です。"
        actions={
          <div className="flex flex-wrap gap-2">
            <CustomerCreateDialog />
            <Button variant="outline" size="sm" asChild className="shadow-inner shadow-indigo-100/30">
              <Link href="/dashboard/machines">保有機一覧</Link>
            </Button>
          </div>
        }
      />

      <MotionFade className="flex flex-col gap-10 px-5 py-7 sm:px-8">
        <section className="rounded-xl border border-dashed border-primary/35 bg-muted/25 p-6 shadow-inner shadow-white/55">
          <h2 className="text-[13px] font-semibold text-foreground">クイック登録</h2>
          <p className="mb-5 text-[12px] text-muted-foreground">
            モーダル（右上）またはこの枠から、その場で顧客を追加できます。
          </p>
          <CustomerQuickForm />
        </section>

        <CustomersDataTable data={tableRows} />
      </MotionFade>
    </div>
  );
}
