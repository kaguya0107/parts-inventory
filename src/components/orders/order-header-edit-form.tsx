"use client";

import { useTransition, useState } from "react";

import { updateOrderHeader } from "@/features/orders/actions";
import type { OrderDocumentType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  orderId: string;
  supplierName: string | null;
  memo: string | null;
  documentType: OrderDocumentType;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  quoteReplyAmount: string;
  quoteReplyLeadTime: string | null;
  disabled?: boolean;
};

export function OrderHeaderEditForm({
  orderId,
  supplierName,
  memo,
  documentType,
  contactName,
  contactPhone,
  contactEmail,
  quoteReplyAmount,
  quoteReplyLeadTime,
  disabled,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (disabled) return null;

  return (
    <form
      className="max-w-xl space-y-3 rounded-lg border border-dashed border-muted px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("orderId", orderId);
        startTransition(async () => {
          setMessage(null);
          const res = await updateOrderHeader(fd);
          if (!res.ok) {
            setMessage(res.message);
            return;
          }
          window.location.reload();
        });
      }}
    >
      <p className="text-sm font-semibold">注文ヘッダ・連絡先の編集</p>
      <div className="space-y-1">
        <Label htmlFor="hdr-doc">書類種別</Label>
        <select
          id="hdr-doc"
          name="documentType"
          className="h-10 w-full rounded-md border border-input px-2 text-sm"
          defaultValue={documentType}
        >
          <option value="PURCHASE_ORDER">発注書</option>
          <option value="QUOTE_REQUEST">見積依頼</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="hdr-supplier">発注先</Label>
        <Input
          id="hdr-supplier"
          name="supplierName"
          defaultValue={supplierName ?? ""}
          placeholder="発注先名"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="hdr-contact-name">注文担当者名</Label>
        <Input id="hdr-contact-name" name="contactName" defaultValue={contactName ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="hdr-phone">連絡先（携帯）</Label>
        <Input id="hdr-phone" name="contactPhone" type="tel" defaultValue={contactPhone ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="hdr-email">連絡先（メール）</Label>
        <Input id="hdr-email" name="contactEmail" type="email" defaultValue={contactEmail ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="hdr-memo">備考</Label>
        <Textarea id="hdr-memo" name="memo" rows={3} defaultValue={memo ?? ""} />
      </div>
      <div className="rounded-md border border-dashed border-muted/80 bg-muted/20 p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">見積回答（社内メモ・後から転記）</p>
        <div className="space-y-1">
          <Label htmlFor="hdr-quote-amt" className="text-xs font-normal text-muted-foreground">
            見積金額（税別など運用に合わせて）
          </Label>
          <Input
            id="hdr-quote-amt"
            name="quoteReplyAmount"
            defaultValue={quoteReplyAmount ?? ""}
            placeholder="例：125000"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="hdr-quote-lead" className="text-xs font-normal text-muted-foreground">
            納期回答
          </Label>
          <Input id="hdr-quote-lead" name="quoteReplyLeadTime" defaultValue={quoteReplyLeadTime ?? ""} placeholder="例：受注後2週間" />
        </div>
      </div>
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "保存中…" : "ヘッダを保存"}
      </Button>
    </form>
  );
}
