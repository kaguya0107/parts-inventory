"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { appendOrderLine } from "@/features/orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [mode, setMode] = useState<"MASTER" | "FREE_TEXT">("MASTER");
  const [partId, setPartId] = useState(() => parts[0]?.id ?? "");

  useEffect(() => {
    if (mode !== "MASTER") return;
    if (parts.length === 0) {
      setPartId("");
      return;
    }
    if (!partId || !parts.some((p) => p.id === partId)) {
      setPartId(parts[0]!.id);
    }
  }, [mode, parts, partId]);

  return (
    <div className="grid gap-4 md:max-w-2xl">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "MASTER" ? "default" : "outline"}
          onClick={() => setMode("MASTER")}
        >
          マスタから選択
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "FREE_TEXT" ? "default" : "outline"}
          onClick={() => setMode("FREE_TEXT")}
        >
          直接入力（品名・品番・機体情報）
        </Button>
      </div>

      <form
        key={mode}
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("orderId", orderId);
          fd.set("lineMode", mode);
          if (mode === "MASTER") {
            fd.set("partId", partId);
          }
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
        <input type="hidden" name="lineMode" value={mode} />

        {mode === "MASTER" ? (
          <>
            {parts.length === 0 ? (
              <p className="text-xs text-destructive">
                部品マスタが空です。直接入力に切り替えるか、先に部品登録してください。
              </p>
            ) : (
              <div className="grid gap-1">
                <label className="text-xs text-muted-foreground" htmlFor="part-select">
                  対象品目 *
                </label>
                <select
                  id="part-select"
                  name="partId"
                  required={mode === "MASTER"}
                  className="h-10 rounded-md border border-input px-2 text-[13px]"
                  value={partId}
                  onChange={(e) => setPartId(e.target.value)}
                >
                  {parts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}（現在庫 {p.currentQty}）
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">品名 *</Label>
              <Input name="freeItemName" required={mode === "FREE_TEXT"} placeholder="例：Vベルト A-52" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">品番（不明なら空欄）</Label>
              <Input name="freePartNo" placeholder="OEM / 社外品番" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">仕様機 型式</Label>
              <Input name="machineModel" placeholder="例：SM-720" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">号機</Label>
              <Input name="machineUnitNo" placeholder="例：001" />
            </div>
            <div className="grid gap-1 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">エンジン No.</Label>
              <Input name="machineEngineNo" placeholder="任意" />
            </div>
          </div>
        )}

        <div className="grid gap-1">
          <Label htmlFor="lineNoteAppend" className="text-xs text-muted-foreground font-normal">
            行ごとの備考（任意）
          </Label>
          <Textarea id="lineNoteAppend" name="lineNote" rows={2} placeholder="行の注記など" />
        </div>

        <div className="grid gap-3 md:grid-cols-[150px_auto] md:items-end">
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="orderedQty">
              数量 *
            </label>
            <Input id="orderedQty" name="orderedQty" type="number" required min={1} defaultValue={1} />
          </div>
          <Button type="submit" disabled={pending || (mode === "MASTER" && parts.length === 0)}>
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
    </div>
  );
}
