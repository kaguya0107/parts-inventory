"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { RepairDeleteButton } from "@/components/repairs/repair-delete-button";

export type RepairTableRow = {
  id: string;
  repairDateSort: string;
  repairDateDisplay: string;
  title: string;
  fileName: string;
};

const columns: ColumnDef<RepairTableRow>[] = [
  {
    accessorKey: "repairDateSort",
    header: "日付",
    cell: ({ row }) => <span className="tabular-nums">{row.original.repairDateDisplay}</span>,
  },
  {
    accessorKey: "title",
    header: "タイトル",
    cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
  },
  {
    accessorKey: "fileName",
    header: "ファイル",
    cell: ({ row }) => (
      <span className="max-w-[240px] truncate text-xs text-muted-foreground">{row.original.fileName}</span>
    ),
  },
  {
    id: "dl",
    header: "",
    enableSorting: false,
    accessorFn: (row) => row.id,
    cell: ({ row }) => (
      <Link
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        href={`/api/repairs/${row.original.id}/file`}
        prefetch={false}
      >
        ダウンロード
      </Link>
    ),
  },
  {
    id: "del",
    header: "",
    enableSorting: false,
    cell: ({ row }) => <RepairDeleteButton recordId={row.original.id} />,
  },
];

export function RepairsDataTable({ data }: { data: RepairTableRow[] }) {
  return (
    <DataTable columns={columns} data={data} filterPlaceholder="タイトル・ファイル名で絞り込み…" emptyLabel="修理履歴がありません。" />
  );
}
