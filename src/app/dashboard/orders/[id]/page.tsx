import { notFound } from "next/navigation";
import Link from "next/link";

import { DashboardPageFrame, DashboardContent } from "@/components/layout/dashboard-page-frame";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { CancelOrderButton } from "@/components/orders/cancel-order-button";
import { ReceiveLineControl } from "@/components/orders/receive-line-control";
import { AppendOrderLineForm } from "@/components/orders/append-order-line-form";
import { OrderHeaderEditForm } from "@/components/orders/order-header-edit-form";
import { OrderLineManage } from "@/components/orders/order-line-manage";
import { OrderAttachmentsPanel } from "@/components/orders/order-attachments-panel";
import { OrderShareEmailPanel } from "@/components/orders/order-share-email-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { orderStatusLabel, orderLineStatusLabel, orderDocumentTypeLabel } from "@/lib/labels";
import { jpDateLabel } from "@/lib/utils";
import { getOrderWithLines } from "@/server/services/orders.service";
import { listPartsAlphabetical } from "@/server/services/parts.service";

type ParamsPromise = Promise<{ id: string }>;

export default async function OrderDetailPage(props: { params: ParamsPromise }) {
  const { id } = await props.params;

  const [order, parts] = await Promise.all([getOrderWithLines(id), listPartsAlphabetical()]);

  if (!order) return notFound();

  const canModify = order.status !== "CANCELLED";
  const showReceive = order.documentType === "PURCHASE_ORDER";

  return (
    <DashboardPageFrame minHeight="screen">
      <DashboardHeader
        title="注文明細／注文書"
        description={`${orderDocumentTypeLabel[order.documentType]}・${orderStatusLabel[order.status]}／発注先：${order.supplierName ?? "—"}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/orders/${order.id}/print`} target="_blank" rel="noreferrer">
                印刷用表示
              </Link>
            </Button>
            <Link href="/dashboard/orders" className="text-xs uppercase tracking-wide underline">
              ← 一覧
            </Link>
          </div>
        }
      />

      <DashboardContent className="gap-6 px-8 py-6">
        <div className="grid gap-1 text-sm">
          <p>注文日：{jpDateLabel(order.orderDate)}</p>
          <p>
            担当：{order.contactName ?? "—"}／TEL {order.contactPhone ?? "—"}／{order.contactEmail ?? "—"}
          </p>
          {order.documentType === "QUOTE_REQUEST" ? (
            <p className="text-xs text-amber-800">
              見積依頼書です。入荷処理は「発注書」に切り替えたうえでマスタ紐付け行のみ可能です。
            </p>
          ) : null}
          <p className="whitespace-pre-line text-muted-foreground">{order.memo ?? "備考メモなし"}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <OrderShareEmailPanel orderId={order.id} defaultTo={order.contactEmail} />
          {canModify ? <OrderAttachmentsPanel orderId={order.id} /> : null}
        </div>

        {order.attachments.length ? (
          <ul className="text-sm text-muted-foreground">
            添付ファイル：
            {order.attachments.map((a) => (
              <li key={a.id} className="ml-4 list-disc">
                <a href={a.fileUrl} className="text-primary underline" target="_blank" rel="noreferrer">
                  {a.fileName}
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        {canModify ? (
          <OrderHeaderEditForm
            orderId={order.id}
            supplierName={order.supplierName}
            memo={order.memo}
            documentType={order.documentType}
            contactName={order.contactName}
            contactPhone={order.contactPhone}
            contactEmail={order.contactEmail}
            quoteReplyAmount={order.quoteReplyAmount?.toString() ?? ""}
            quoteReplyLeadTime={order.quoteReplyLeadTime}
          />
        ) : null}

        {canModify && order.lines.every((l) => l.receivedQty === 0) ? (
          <CancelOrderButton orderId={order.id} />
        ) : null}

        <section className="space-y-3 rounded-lg border border-dashed border-muted px-4 py-4">
          <h2 className="text-sm font-semibold">明細を追加</h2>

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
              <TableHead>{showReceive ? "入荷" : "—"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line) => {
              const remaining = line.orderedQty - line.receivedQty;
              const labelName =
                line.lineSource === "FREE_TEXT"
                  ? (line.freeItemName ?? "（自由記述）")
                  : (line.part?.name ?? "—");
              const sub =
                line.lineSource === "FREE_TEXT"
                  ? [line.freePartNo, line.machineModel, line.machineUnitNo, line.machineEngineNo]
                      .filter(Boolean)
                      .join(" · ") || "品番・機体情報は注文書参照"
                  : line.unitCost
                    ? `単価 ${line.unitCost.toString()} 円`
                    : "単価未入力";
              const canReceiveLine = showReceive && !!line.partId;

              return (
                <TableRow key={line.id}>
                  <TableCell>{orderLineStatusLabel[line.lineStatus]}</TableCell>
                  <TableCell>
                    <div className="font-medium">{labelName}</div>
                    <div className="text-xs text-muted-foreground">{sub}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-semibold">
                      {line.orderedQty}/{line.receivedQty}
                    </div>
                    <div className="text-xs text-muted-foreground">残 {remaining}</div>
                  </TableCell>
                  <TableCell className="min-w-[260px]">
                    {canModify && canReceiveLine ? (
                      <div className="space-y-3">
                        <ReceiveLineControl orderLineId={line.id} remaining={remaining} />
                        <OrderLineManage
                          lineId={line.id}
                          orderedQty={line.orderedQty}
                          receivedQty={line.receivedQty}
                        />
                      </div>
                    ) : canModify && !line.partId ? (
                      <span className="text-xs text-muted-foreground">
                        マスタ未連携行（FAX用・入荷は別途マスタ行で）
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DashboardContent>
    </DashboardPageFrame>
  );
}
