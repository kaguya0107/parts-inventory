"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { createOrderHeader } from "@/features/orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function OrderHeaderCreateForm({ initialError }: { initialError?: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(initialError ?? null);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          setMessage(null);
          const res = await createOrderHeader(formData);
          if (!res.ok) {
            setMessage(res.message);
            return;
          }
          if (res.data?.id) {
            router.push(`/dashboard/orders/${res.data.id}`);
            router.refresh();
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="supplierName">発注先</Label>
        <Input id="supplierName" name="supplierName" placeholder="会社名など" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="memo">備考メモ</Label>
        <Textarea id="memo" name="memo" rows={4} placeholder="伝票備考など" />
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "作成中..." : "注文を作成"}
      </Button>
    </form>
  );
}
