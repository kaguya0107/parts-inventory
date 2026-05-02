"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteRepairRecord } from "@/features/repairs/actions";
import { notifyActionResult } from "@/lib/toast-action";
import { Button } from "@/components/ui/button";

export function RepairDeleteButton({ recordId }: { recordId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (!confirm("この記録とファイルを削除してもよいですか？")) return;
          const res = await deleteRepairRecord(recordId);
          notifyActionResult(res, "削除しました");
          if (!res.ok) return;
          router.refresh();
        })
      }
    >
      {pending ? "…" : "削除"}
    </Button>
  );
}
