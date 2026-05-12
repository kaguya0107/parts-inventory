"use client";

export function OrderPrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="no-print mb-6 flex flex-wrap gap-3">
      <button
        type="button"
        className="rounded border border-slate-400 bg-slate-50 px-3 py-2 text-sm"
        onClick={() => window.print()}
      >
        印刷 / PDF保存
      </button>
      <a className="rounded border border-slate-400 px-3 py-2 text-sm" href={backHref}>
        戻る
      </a>
    </div>
  );
}
