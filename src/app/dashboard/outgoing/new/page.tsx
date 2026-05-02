import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import { OutgoingIssueForm } from "@/components/outgoing/outgoing-issue-form";
import { prisma } from "@/lib/db";

export default async function OutgoingNewPage() {
  const [customers, machines, parts] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.machine.findMany({ include: { customer: true }, orderBy: { modelName: "asc" }, take: 500 }),
    prisma.part.findMany({ orderBy: { name: "asc" }, take: 1000 }).then((items) =>
      items.map((p) => ({
        id: p.id,
        name: p.name,
        currentQty: p.currentQty,
      })),
    ),
  ]);

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <DashboardHeader
        title="出庫（使用）入力"
        description="部品リストは自由に増やせます。在庫不足のときは自動で処理を中止します。"
      />
      <MotionFade className="flex flex-1 flex-col px-8 py-6">
        <OutgoingIssueForm customers={customers} machines={machines} parts={parts} />
      </MotionFade>
    </div>
  );
}
