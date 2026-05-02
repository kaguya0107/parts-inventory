import Link from "next/link";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import { OrderHeaderCreateForm } from "@/components/orders/order-header-create-form";

export default function OrdersNewPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <DashboardHeader title="注文ヘッダ登録" description="まず注文伝票だけを作成し、次のページで発注明細・入荷を登録できます。" />
      <MotionFade className="flex flex-1 flex-col gap-6 px-8 py-6">
        <OrderHeaderCreateForm />
        <Link className="text-sm text-muted-foreground underline" href="/dashboard/orders">
          一覧に戻る
        </Link>
      </MotionFade>
    </div>
  );
}
