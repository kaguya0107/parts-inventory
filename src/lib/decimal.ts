import { Prisma } from "@prisma/client";

export function toOptionalDecimal(
  raw: string | undefined | null,
): Prisma.Decimal | undefined {
  if (raw === undefined || raw === null) return undefined;
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  return new Prisma.Decimal(trimmed);
}
