"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isHome = pathname === "/";

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div id="top" className={isHome ? "ud-chrome--home" : undefined}>
      {isHome ? null : <SiteHeader />}
      <main>{children}</main>
      {isHome ? null : <SiteFooter />}
    </div>
  );
}
