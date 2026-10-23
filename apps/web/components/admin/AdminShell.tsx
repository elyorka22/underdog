"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/helper", label: "Helper Control" },
  { href: "/admin/queries", label: "Search Queries" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/candidates", label: "Candidate Queue" },
  { href: "/admin/communities", label: "Community Catalog" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/operations", label: "Operations" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/audit", label: "Audit Log" },
];

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    adminFetch<{ authenticated: boolean; configured: boolean }>("/api/admin/session")
      .then((session) => {
        if (!session.configured) {
          setToast("Admin auth is not configured on API");
        }
        if (!session.authenticated) {
          router.replace("/admin/login");
          return;
        }
        setReady(true);
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  async function logout() {
    await adminFetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  if (!ready) {
    return (
      <div className="admin-root">
        <div className="admin-main admin-muted">Checking admin session…</div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <div className="admin-shell">
        <aside className="admin-side">
          <h1>UnderDog Admin</h1>
          <nav className="admin-nav" aria-label="Admin">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  pathname === link.href ||
                  (link.href !== "/admin" && pathname.startsWith(link.href))
                    ? "active"
                    : undefined
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div style={{ marginTop: 18 }}>
            <button className="admin-btn" type="button" onClick={logout}>
              Log out
            </button>
          </div>
        </aside>
        <div className="admin-main">
          <div className="admin-mobile-nav">
            {LINKS.map((link) => (
              <Link key={link.href} className="admin-btn" href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="admin-top">
            <h2>{title}</h2>
            <Link className="admin-btn" href="/">
              Public site
            </Link>
          </div>
          {children}
        </div>
      </div>
      {toast ? <div className="admin-toast">{toast}</div> : null}
    </div>
  );
}

export function useToast() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3200);
    return () => clearTimeout(timer);
  }, [message]);
  return {
    message,
    show: setMessage as (value: string) => void,
    node: message ? <div className="admin-toast">{message}</div> : null,
  };
}
