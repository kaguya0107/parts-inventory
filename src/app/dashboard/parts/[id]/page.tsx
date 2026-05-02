import { notFound } from "next/navigation";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import { PartForm } from "@/components/parts/part-form";
import { prisma } from "@/lib/db";

type ParamsPromise = Promise<{ id: string }>;

export default async function PartDetailPage(props: { params: ParamsPromise }) {
  const { id } = await props.params;

  const part = await prisma.part.findUnique({
    where: { id },
  });

  if (!part) return notFound();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <DashboardHeader title="部品を編集" description={part.name} />
      <MotionFade className="flex flex-1 flex-col px-8 py-6">
        <PartForm part={part} />
      </MotionFade>
    </div>
  );
}
