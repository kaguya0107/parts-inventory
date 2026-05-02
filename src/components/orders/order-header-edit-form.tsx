"use client";

import { useTransition, useState } from "react";

import { updateOrderHeader } from "@/features/orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  orderId: string;
  supplierName: string | null;
  memo: string | null;
  disabled?: boolean;
};

export function OrderHeaderEditForm({ orderId, supplierName, memo, disabled }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (disabled) return null;

  return (
    <form
      className="max-w-xl space-y-3 rounded-lg border border-dashed border-muted px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("orderId", orderId);
        startTransition(async () => {
          setMessage(null);
          const res = await updateOrderHeader(fd);
          if (!res.ok) {
            setMessage(res.message);
            return;
          }
          window.location.reload();
        });
      }}
    >
      <p className="text-sm font-semibold">注文ヘッダの編集</p>
      <div className="space-y-1">
        <Label htmlFor="hdr-supplier">発注先</Label>
        <Input
          id="hdr-supplier"
          name="supplierName"
          defaultValue={supplierName ?? ""}
          placeholder="発注先名"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="hdr-memo">備考</Label>
        <Textarea id="hdr-memo" name="memo" rows={3} defaultValue={memo ?? ""} />
      </div>
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "保存中…" : "ヘッダを保存"}
      </Button>
    </form>
  );
}
