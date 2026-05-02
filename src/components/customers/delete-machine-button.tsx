"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteMachine } from "@/features/customers/actions";
import { notifyActionResult } from "@/lib/toast-action";
import { Button } from "@/components/ui/button";

export function DeleteMachineButton({ machineId }: { machineId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="sm"
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (!confirm("この保有機情報を削除してもよろしいですか？")) return;
          const res = await deleteMachine(machineId);
          notifyActionResult(res, "削除しました");
          if (!res.ok) return;
          router.refresh();
        })
      }
    >
      削除
    </Button>
  );
}
