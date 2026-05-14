"use client";

import { useState, useTransition } from "react";

import { deleteOrderLine, updateOrderLine } from "@/features/orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  lineId: string;
  orderedQty: number;
  receivedQty: number;
  lineNote: string | null;
  unitCost: string | null;
};

export function OrderLineManage({ lineId, orderedQty, receivedQty, lineNote, unitCost }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [qty, setQty] = useState(orderedQty);
  const [note, setNote] = useState(lineNote ?? "");
  const [cost, setCost] = useState(unitCost ?? "");

  if (receivedQty > 0) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-muted/60 pt-2">
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("orderLineId", lineId);
          startTransition(async () => {
            setMessage(null);
            const res = await updateOrderLine(fd);
            if (!res.ok) {
              setMessage(res.message);
              return;
            }
            window.location.reload();
          });
        }}
      >
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">発注数の修正</span>
            <Input
              type="number"
              className="h-8 w-24 text-right"
              name="orderedQty"
              min={receivedQty || 1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">単価（円・任意）</span>
            <Input
              type="text"
              className="h-8 w-28 text-right"
              name="unitCost"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="未入力可"
            />
          </label>
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            更新
          </Button>
        </div>
        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground font-normal">行ごとの備考</Label>
          <Textarea
            name="lineNote"
            rows={2}
            className="min-h-[60px] text-xs"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </form>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!window.confirm("この明細を削除しますか？")) return;
          const fd = new FormData();
          fd.set("orderLineId", lineId);
          startTransition(async () => {
            setMessage(null);
            const res = await deleteOrderLine(fd);
            if (!res.ok) {
              setMessage(res.message);
              return;
            }
            window.location.reload();
          });
        }}
      >
        <Button type="submit" size="sm" variant="destructive" disabled={pending}>
          明細を削除
        </Button>
      </form>
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
