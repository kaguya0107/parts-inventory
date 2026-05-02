import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import * as RepairsService from "@/server/services/repairs.service";
import { saveRepairPdf } from "@/lib/storage/local";

const MAX_BYTES = 15 * 1024 * 1024;

const repairMetaSchema = z.object({
  title: z.string().trim().min(1, "タイトルが必要です"),
  repairDate: z.coerce.date().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ ok: false, error: "invalid_content_type" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim();
  const repairDateRaw = form.get("repairDate");
  const metaResult = repairMetaSchema.safeParse({
    title,
    repairDate:
      typeof repairDateRaw === "string" && repairDateRaw.trim() !== ""
        ? repairDateRaw
        : undefined,
  });
  if (!metaResult.success) {
    const msg = metaResult.error.flatten().fieldErrors.title?.[0] ?? "入力を確認してください";
    return NextResponse.json({ ok: false, error: "validation", message: msg }, { status: 400 });
  }

  const repairDate = metaResult.data.repairDate ?? new Date();
  const titleOk = metaResult.data.title;

  if (!(file instanceof Blob)) {
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);
  if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "file_size" }, { status: 400 });
  }

  const isPdfMagic = buf.subarray(0, 5).toString("utf8") === "%PDF-";
  if (!isPdfMagic) {
    return NextResponse.json({ ok: false, error: "not_pdf" }, { status: 400 });
  }

  const uploadedName =
    typeof (file as File).name === "string" ? (file as File).name : "document.pdf";

  const { key } = await saveRepairPdf(
    buf,
    uploadedName.endsWith(".pdf") ? uploadedName : `${uploadedName}.pdf`,
  );

  const safeName = uploadedName.endsWith(".pdf") ? uploadedName : `${uploadedName}.pdf`;

  await RepairsService.createRepairPdfRecord({
    title: titleOk,
    repairDate,
    storedFileKey: key,
    mimeType: "application/pdf",
    fileName: safeName,
    fileSize: buf.byteLength,
  });

  return NextResponse.json({ ok: true });
}
