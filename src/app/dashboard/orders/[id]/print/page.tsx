import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { OrderPrintToolbar } from "@/components/orders/order-print-toolbar";
import { orderDocumentTypeLabel, orderLineStatusLabel, orderStatusLabel } from "@/lib/labels";
import { jpDateLabel, yen } from "@/lib/utils";
import { getOrderWithLines } from "@/server/services/orders.service";

type ParamsPromise = Promise<{ id: string }>;

export default async function OrderPrintPage(props: { params: ParamsPromise }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await props.params;
  const order = await getOrderWithLines(id);
  if (!order) notFound();

  return (
    <div className="print-root min-h-screen bg-white p-8 text-black">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-root { padding: 12mm; }
        }
      `}</style>

      <OrderPrintToolbar backHref={`/dashboard/orders/${order.id}`} />

      <header className="mb-6 border-b-2 border-slate-800 pb-3">
        <h1 className="text-2xl font-bold">{orderDocumentTypeLabel[order.documentType]}</h1>
        <p className="text-sm text-slate-700">注文日 {jpDateLabel(order.orderDate)}／状態 {orderStatusLabel[order.status]}</p>
      </header>

      <section className="mb-4 grid gap-1 text-sm">
        <p>
          <span className="font-semibold">発注先</span> {order.supplierName ?? "＿＿＿＿＿＿"}
        </p>
        <p>
          <span className="font-semibold">注文担当</span> {order.contactName ?? "＿＿＿＿＿＿"}
        </p>
        <p>
          <span className="font-semibold">連絡先（携帯）</span> {order.contactPhone ?? "＿＿＿＿＿＿"}
        </p>
        <p>
          <span className="font-semibold">連絡先（メール）</span> {order.contactEmail ?? "＿＿＿＿＿＿"}
        </p>
        {order.documentType === "QUOTE_REQUEST" && (order.quoteReplyAmount != null || order.quoteReplyLeadTime) ? (
          <div className="mt-2 rounded border border-slate-400 p-2">
            <p className="font-semibold">見積回答（メモ）</p>
            <p>金額目安: {order.quoteReplyAmount != null ? `${order.quoteReplyAmount.toString()} 円` : "—"}</p>
            <p>納期: {order.quoteReplyLeadTime ?? "—"}</p>
          </div>
        ) : null}
        <p className="whitespace-pre-wrap pt-2">
          <span className="font-semibold">備考</span>
          <br />
          {order.memo ?? ""}
        </p>
      </section>

      <table className="w-full border-collapse border border-slate-800 text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-800 p-2 text-left">品名</th>
            <th className="border border-slate-800 p-2 text-left">品番</th>
            <th className="border border-slate-800 p-2 text-left">型式＊号機＊エンジン</th>
            <th className="border border-slate-800 p-2 text-right">数量</th>
            <th className="border border-slate-800 p-2 text-right">単価</th>
            <th className="border border-slate-800 p-2 text-left">行状態</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line) => {
            const name = line.lineSource === "FREE_TEXT" ? (line.freeItemName ?? "—") : line.part?.name ?? "—";
            const partNo =
              line.lineSource === "FREE_TEXT"
                ? line.freePartNo || "（不明可）"
                : [line.part?.oemPartNo, line.part?.aftermarketNo].filter(Boolean).join(" / ") || "—";
            const machine =
              line.lineSource === "FREE_TEXT"
                ? [line.machineModel, line.machineUnitNo, line.machineEngineNo].filter(Boolean).join(" / ") || "—"
                : line.part?.compatibleModels ?? "—";
            return (
              <tr key={line.id}>
                <td className="border border-slate-800 p-2">{name}</td>
                <td className="border border-slate-800 p-2">{partNo}</td>
                <td className="border border-slate-800 p-2">{machine}</td>
                <td className="border border-slate-800 p-2 text-right tabular-nums">{line.orderedQty}</td>
                <td className="border border-slate-800 p-2 text-right tabular-nums">
                  {line.unitCost ? yen(line.unitCost) : "—"}
                </td>
                <td className="border border-slate-800 p-2">{orderLineStatusLabel[line.lineStatus]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {order.attachments.length ? (
        <section className="mt-6 text-sm">
          <p className="font-semibold">添付</p>
          <ul className="list-inside list-disc">
            {order.attachments.map((a) => (
              <li key={a.id}>
                <a href={a.fileUrl} className="text-blue-700 underline" target="_blank" rel="noreferrer">
                  {a.fileName}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="mt-10 border-t border-slate-400 pt-3 text-xs text-slate-600">
        不明栏は空欄のままで可。FAX送付用に印刷し、社内の紙運用にご利用ください。
      </footer>
    </div>
  );
}
