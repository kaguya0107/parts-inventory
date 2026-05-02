import Link from "next/link";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import { PartCreateDialog } from "@/components/parts/part-create-dialog";
import { PartsDataTable, type PartsTableRow } from "@/components/parts/parts-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";
import { yen } from "@/lib/utils";

type SearchShape = Record<string, string | string[] | undefined>;

async function loader(q?: string | null) {
  const trimmed = q?.trim() ?? "";

  const where =
    trimmed.length > 0
      ? {
          OR: [
            { name: { contains: trimmed, mode: "insensitive" as const } },
            { oemPartNo: { contains: trimmed, mode: "insensitive" as const } },
            { aftermarketNo: { contains: trimmed, mode: "insensitive" as const } },
            { compatibleModels: { contains: trimmed, mode: "insensitive" as const } },
          ],
        }
      : undefined;

  return prisma.part.findMany({
    where,
    orderBy: { name: "asc" },
    take: 250,
  });
}

export default async function PartsPage({
  searchParams,
}: {
  searchParams: Promise<SearchShape>;
}) {
  const params = await searchParams;
  const qRaw = typeof params.q === "string" ? params.q : "";
  const parts = await loader(qRaw);

  const rows: PartsTableRow[] = parts.map((part) => ({
    id: part.id,
    name: part.name,
    oemPartNo: part.oemPartNo ?? "—",
    aftermarketNo: part.aftermarketNo ?? "—",
    salePriceDisplay: yen(part.salePrice),
    currentQty: part.currentQty,
  }));

  return (
    <div className="flex min-h-[70vh] flex-1 flex-col">
      <DashboardHeader
        title="部品マスタ"
        description="品番・単価・現在庫と履歴ログを統合運用できます。一覧は並べ替えとクライアント側の細かな絞り込みが可能です（上部の送信検索とも併用可）。"
        actions={
          <div className="flex flex-wrap gap-2">
            <PartCreateDialog>
              <Button size="sm" className="shadow-inner shadow-white/70">
                モーダルで登録
              </Button>
            </PartCreateDialog>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/parts/new">全画面フォームへ</Link>
            </Button>
          </div>
        }
      />
      <MotionFade className="flex flex-1 flex-col gap-5 px-5 py-8 sm:px-8">
        <form className="flex flex-wrap gap-2" action="/dashboard/parts" method="get">
          <Input
            name="q"
            placeholder="サーバー側で品名／型式／品番を検索"
            defaultValue={qRaw}
            className="h-11 max-w-full border-border bg-background shadow-inner shadow-indigo-100/30 sm:w-[min(560px,100%)]"
          />
          <Button type="submit" variant="outline" size="sm" className="h-11">
            適用
          </Button>
        </form>

        <PartsDataTable data={rows} />
      </MotionFade>
    </div>
  );
}
