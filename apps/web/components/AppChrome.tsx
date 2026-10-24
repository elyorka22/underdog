"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isHome = pathname === "/";
  const isSaved = pathname === "/favorites";
  const bare = isHome || isSaved;

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div
      id="top"
      className={
        isHome ? "ud-chrome--home" : isSaved ? "ud-chrome--saved" : undefined
      }
    >
      {bare ? null : <SiteHeader />}
      <main>{children}</main>
      {bare ? null : <SiteFooter />}
    </div>
  );
}
