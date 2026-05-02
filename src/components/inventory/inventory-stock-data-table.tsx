"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";

export type InventoryStockRow = {
  id: string;
  name: string;
  partNos: string;
  qty: number;
};

const columns: ColumnDef<InventoryStockRow>[] = [
  {
    accessorKey: "name",
    header: "部品",
    cell: ({ row }) => (
      <Link
        href={`/dashboard/parts/${row.original.id}`}
        className="font-medium text-primary underline-offset-4 hover:text-primary/90 hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: "partNos", header: "品番（純正 / 社外）" },
  {
    accessorKey: "qty",
    header: "現在庫",
    cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.qty}</span>,
  },
];

export function InventoryStockDataTable({ data }: { data: InventoryStockRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      filterPlaceholder="部品・品番で絞り込み…（サーバー検索済み一覧内）"
      emptyLabel="在庫データがありません。"
    />
  );
}
