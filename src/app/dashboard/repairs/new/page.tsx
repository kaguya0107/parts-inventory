import Link from "next/link";

import { RepairPdfForm } from "@/components/repairs/repair-pdf-form";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";

export default function RepairNewPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <DashboardHeader title="修理履歴（PDF登録）" description="伝票のみで十分なときは、この画面のみを使ってください。" />
      <MotionFade className="flex flex-1 flex-col gap-6 px-8 py-6">
        <RepairPdfForm />
        <Link className="text-sm text-muted-foreground underline" href="/dashboard/repairs">
          一覧へ戻る
        </Link>
      </MotionFade>
    </div>
  );
}
