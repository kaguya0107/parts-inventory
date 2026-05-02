"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { appendOrderLine } from "@/features/orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PartSel = { id: string; name: string; currentQty: number };

export function AppendOrderLineForm({
  orderId,
  parts,
}: {
  orderId: string;
  parts: PartSel[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (parts.length === 0) {
    return <p className="text-xs text-destructive">部品マスタが空です。先に「部品登録」をしてください。</p>;
  }

  return (
    <form
      className="grid gap-4 md:max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("orderId", orderId);
        startTransition(async () => {
          setMessage(null);
          const result = await appendOrderLine(fd);
          if (!result.ok) {
            setMessage(result.message);
            return;
          }
          e.currentTarget.reset();
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <div className="grid gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="part-select">
          対象品目 *
        </label>
        <select
          id="part-select"
          name="partId"
          required
          className="h-10 rounded-md border border-input px-2 text-[13px]"
          defaultValue=""
        >
          <option value="" disabled>
            部品を選択
          </option>
          {parts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}（現在庫 {p.currentQty}）
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 md:grid-cols-[150px_auto] md:items-end">
        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground" htmlFor="orderedQty">
            発注数量 *
          </label>
          <Input id="orderedQty" name="orderedQty" type="number" required min={1} />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "処理中..." : "行を追加"}
        </Button>
      </div>
      <div className="grid gap-1 md:col-span-full">
        <Label htmlFor="unitCostAppend" className="text-xs text-muted-foreground font-normal">
          単価（任意）
        </Label>
        <Input id="unitCostAppend" name="unitCost" placeholder="例：3200" />
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </form>
  );
}
