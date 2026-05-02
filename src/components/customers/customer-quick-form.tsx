"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { createCustomer } from "@/features/customers/actions";
import { notifyActionResult } from "@/lib/toast-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CustomerQuickForm({
  embedded,
  onFinish,
}: {
  embedded?: boolean;
  onFinish?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className={
        embedded
          ? "grid gap-4"
          : "grid gap-4 md:max-w-xl rounded-lg border border-border bg-card p-5 shadow-sm"
      }
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setMessage(null);
          const res = await createCustomer(fd);
          notifyActionResult(res, "登録しました");
          if (!res.ok) {
            setMessage(res.message);
            return;
          }
          e.currentTarget.reset();
          onFinish?.();
          router.refresh();
        });
      }}
    >
      <div className={`grid gap-2 gap-x-4 ${embedded ? "" : "md:grid-cols-2"}`}>
        <div>
          <Label htmlFor="cust-name">顧客名 *</Label>
          <Input id="cust-name" name="name" required />
        </div>
        <div>
          <Label htmlFor="cust-muni">所在地（町村名）*</Label>
          <Input id="cust-muni" name="municipality" placeholder="〇〇県△△町" required />
        </div>
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={pending} className="transition-transform active:scale-[0.985]">
          {pending ? "登録中…" : "顧客を追加"}
        </Button>
        {embedded ? (
          <Button type="button" variant="outline" disabled={pending} onClick={() => onFinish?.()}>
            閉じる
          </Button>
        ) : null}
      </div>
    </form>
  );
}
