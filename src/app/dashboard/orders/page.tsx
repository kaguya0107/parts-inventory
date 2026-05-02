import Link from "next/link";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import {
  OrdersDataTable,
  type OrderTableRow,
} from "@/components/orders/orders-data-table";
import { Button } from "@/components/ui/button";
import { orderStatusLabel } from "@/lib/labels";
import { prisma } from "@/lib/db";

async function loader() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      _count: { select: { lines: true } },
    },
  });
}

export default async function OrdersPage() {
  const orders = await loader();

  const rows: OrderTableRow[] = orders.map((order) => ({
    id: order.id,
    sortKey: order.orderDate.toISOString(),
    statusLabel: orderStatusLabel[order.status],
    supplier: order.supplierName ?? "—",
    lines: order._count.lines,
  }));

  return (
    <div className="flex min-h-[70vh] flex-1 flex-col">
      <DashboardHeader
        title="注文・入荷"
        description="未完の調達〜入荷まわりの進捗。一覧は状態・発注先で素早く探せます。"
        actions={
          <Button size="sm" className="shadow-inner shadow-white/70" asChild>
            <Link href="/dashboard/orders/new">新規注文</Link>
          </Button>
        }
      />

      <MotionFade className="flex flex-col gap-6 px-5 py-8 sm:px-8">
        <OrdersDataTable data={rows} />
      </MotionFade>
    </div>
  );
}
