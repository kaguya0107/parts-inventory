"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Customer, Machine } from "@prisma/client";

import { createOutgoingIssue } from "@/features/outgoing/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type PartsOption = { id: string; name: string; currentQty: number };

type Props = {
  customers: Customer[];
  machines: (Machine & { customer: Customer })[];
  parts: PartsOption[];
};

type Line = {
  id: number;
  partId: string;
  quantity: number;
};

export function OutgoingIssueForm(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>(() => [
    {
      id: Date.now(),
      partId: props.parts[0]?.id ?? "",
      quantity: 1,
    },
  ]);

  const canSubmit =
    props.parts.length > 0 &&
    lines.length > 0 &&
    lines.every((l) => l.partId && l.quantity > 0);

  return (
    <form
      className="max-w-5xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        const fd = new FormData(e.currentTarget);

        fd.set(
          "lines",
          JSON.stringify(lines.map((l) => ({ partId: l.partId, quantity: l.quantity }))),
        );

        startTransition(async () => {
          setMessage(null);
          const res = await createOutgoingIssue(fd);
          if (!res.ok) {
            setMessage(res.message);
            return;
          }
          router.push("/dashboard/outgoing");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="issueDate">日付</Label>
          <Input id="issueDate" name="issueDate" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerId">顧客（任意）</Label>
          <select id="customerId" name="customerId" className="h-10 w-full rounded-md border border-input px-3 text-sm">
            <option value="">未選択</option>
            {props.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}／{c.municipality}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="machineId">保有機（任意）</Label>
          <select id="machineId" name="machineId" className="h-10 w-full rounded-md border border-input px-3 text-sm">
            <option value="">未選択</option>
            {props.machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.customer.name} · {m.modelName}／{m.unitNo}
                {m.engineNo ? ` (${m.engineNo})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="memo">メモ（任意）</Label>
          <Textarea id="memo" name="memo" rows={3} />
        </div>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">使用部品一覧</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setLines((prev) =>
                prev.concat([
                  {
                    id: Date.now(),
                    partId: props.parts[0]?.id ?? "",
                    quantity: 1,
                  },
                ]),
              )
            }
          >
            行を追加
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>部品</TableHead>
              <TableHead>数量</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>
                  <select
                    className="h-10 w-full max-w-xl rounded-md border border-input px-3 text-[13px]"
                    value={line.partId}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l) => (l.id === line.id ? { ...l, partId: e.target.value } : l)),
                      )
                    }
                  >
                    {props.parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}（在庫 {p.currentQty}）
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell className="w-36">
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l) =>
                          l.id === line.id ? { ...l, quantity: Number(e.target.value) || 1 } : l,
                        ),
                      )
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    disabled={lines.length === 1}
                    onClick={() => setLines((prev) => prev.filter((row) => row.id !== line.id))}
                  >
                    削除
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {props.parts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          部品マスタが空です。<Link href="/dashboard/parts/new" className="underline">部品登録へ</Link>
        </p>
      ) : null}

      {message ? <p className="text-sm text-destructive">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!canSubmit || pending}>
          {pending ? "処理中..." : "出庫を登録"}
        </Button>
        <Button variant="ghost" type="button" asChild disabled={pending}>
          <Link href="/dashboard/outgoing">戻る</Link>
        </Button>
      </div>
    </form>
  );
}
