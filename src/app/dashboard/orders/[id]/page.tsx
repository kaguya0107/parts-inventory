import { notFound } from "next/navigation";
import Link from "next/link";

import { CancelOrderButton } from "@/components/orders/cancel-order-button";
import { ReceiveLineControl } from "@/components/orders/receive-line-control";
import { AppendOrderLineForm } from "@/components/orders/append-order-line-form";
import { OrderHeaderEditForm } from "@/components/orders/order-header-edit-form";
import { OrderLineManage } from "@/components/orders/order-line-manage";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import { prisma } from "@/lib/db";
import { jpDateLabel } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { orderStatusLabel, orderLineStatusLabel } from "@/lib/labels";

type ParamsPromise = Promise<{ id: string }>;


export default async function OrderDetailPage(props: { params: ParamsPromise }) {
  const { id } = await props.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { lines: { include: { part: true }, orderBy: { createdAt: "asc" } } },
  });

  if (!order) return notFound();

  const parts = await prisma.part.findMany({ orderBy: { name: "asc" } });

  const canModify = order.status !== "CANCELLED";

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <DashboardHeader
        title="注文明細／入荷"
        description={`注文状態：${orderStatusLabel[order.status]}／発注先：${order.supplierName ?? "—"}`}
        actions={
          <Link href="/dashboard/orders" className="text-xs uppercase tracking-wide underline">
            ← 一覧
          </Link>
        }
      />

      <MotionFade className="flex flex-col gap-6 px-8 py-6">
        <div className="grid gap-1 text-sm">
          <p>注文日：{jpDateLabel(order.orderDate)}</p>
          <p className="whitespace-pre-line text-muted-foreground">{order.memo ?? "備考メモなし"}</p>
        </div>

        {canModify ? (
          <OrderHeaderEditForm
            orderId={order.id}
            supplierName={order.supplierName}
            memo={order.memo}
          />
        ) : null}

        {canModify && order.lines.every((l) => l.receivedQty === 0) ? (
          <CancelOrderButton orderId={order.id} />
        ) : null}

        <section className="space-y-3 rounded-lg border border-dashed border-muted px-4 py-4">
          <h2 className="text-sm font-semibold">発注明細を追加</h2>

          {!canModify ? (
            <p className="text-xs text-muted-foreground">取消済みの注文です。</p>
          ) : (
            <AppendOrderLineForm
              orderId={order.id}
              parts={parts.map((p) => ({ id: p.id, name: p.name, currentQty: p.currentQty }))}
            />
          )}
        </section>

        <Table containerClassName="border-muted">
          <TableHeader>
            <TableRow>
              <TableHead>状態</TableHead>
              <TableHead>品目</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>入荷</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line) => {
              const remaining = line.orderedQty - line.receivedQty;
              return (
                <TableRow key={line.id}>
                  <TableCell>{orderLineStatusLabel[line.lineStatus]}</TableCell>
                  <TableCell>
                    <div className="font-medium">{line.part.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {line.unitCost ? `単価 ${line.unitCost.toString()} 円` : "単価未入力"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-semibold">
                      {line.orderedQty}/{line.receivedQty}
                    </div>
                    <div className="text-xs text-muted-foreground">残 {remaining}</div>
                  </TableCell>
                  <TableCell className="min-w-[260px]">
                    {canModify ? (
                      <div className="space-y-3">
                        <ReceiveLineControl orderLineId={line.id} remaining={remaining} />
                        <OrderLineManage
                          lineId={line.id}
                          orderedQty={line.orderedQty}
                          receivedQty={line.receivedQty}
                        />
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </MotionFade>
    </div>
  );
}
