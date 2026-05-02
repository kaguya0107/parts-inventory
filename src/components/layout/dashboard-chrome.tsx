"use client";

import { usePathname } from "next/navigation";

import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh bg-gradient-to-br from-muted/70 via-background to-background">
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar />
      </div>
      <div className="flex min-h-dvh flex-1 flex-col">
        <MobileNav pathname={pathname} />
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
