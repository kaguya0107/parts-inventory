"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RepairPdfForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        startTransition(async () => {
          setMessage(null);
          const fd = new FormData(form);
          try {
            const res = await fetch("/api/uploads/repair-pdf", {
              method: "POST",
              body: fd,
            });
            if (!res.ok) {
              setMessage("アップロードに失敗しました (PDFのみ / サイズ確認)");
              return;
            }
            form.reset();
            router.push("/dashboard/repairs");
            router.refresh();
          } catch {
            setMessage("ネットワークエラーが発生しました");
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="title">タイトル *</Label>
        <Input id="title" name="title" required placeholder="伝票概要など" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="repairDate">日付</Label>
        <Input id="repairDate" type="date" name="repairDate" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">修理伝票PDF *</Label>
        <Input id="file" name="file" type="file" accept="application/pdf" required />
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "処理中..." : "アップロード"}
        </Button>
        <Button variant="ghost" type="button" asChild disabled={pending}>
          <Link href="/dashboard/repairs">一覧へ</Link>
        </Button>
      </div>
    </form>
  );
}
