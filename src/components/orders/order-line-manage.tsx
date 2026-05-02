"use client";

import { useState, useTransition } from "react";

import { deleteOrderLine, updateOrderLine } from "@/features/orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  lineId: string;
  orderedQty: number;
  receivedQty: number;
};

export function OrderLineManage({ lineId, orderedQty, receivedQty }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [qty, setQty] = useState(orderedQty);

  if (receivedQty > 0) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-muted/60 pt-2">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData();
          fd.set("orderLineId", lineId);
          fd.set("orderedQty", String(qty));
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
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">発注数の修正</span>
          <Input
            type="number"
            className="h-8 w-24 text-right"
            min={receivedQty || 1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </label>
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          更新
        </Button>
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
