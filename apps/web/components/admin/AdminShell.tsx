"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

const LINKS = [
  { href: "/admin", label: "Umumiy ko‘rinish" },
  { href: "/admin/helper", label: "Helper boshqaruvi" },
  { href: "/admin/queries", label: "Qidiruv so‘rovlari" },
  { href: "/admin/categories", label: "Kategoriyalar" },
  { href: "/admin/candidates", label: "Nomzodlar navbati" },
  { href: "/admin/communities", label: "Hamjamiyatlar" },
  { href: "/admin/analytics", label: "Analitika" },
  { href: "/admin/operations", label: "Operatsiyalar" },
  { href: "/admin/settings", label: "Sozlamalar" },
  { href: "/admin/audit", label: "Audit jurnali" },
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
  const [navOpen, setNavOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    adminFetch<{ authenticated: boolean; configured: boolean }>("/api/admin/session")
      .then((session) => {
        if (!session.configured) {
          setToast("API da admin autentifikatsiyasi sozlanmagan");
        }
        if (!session.authenticated) {
          router.replace("/admin/login");
          return;
        }
        setReady(true);
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("admin-nav-lock", navOpen);
    return () => document.body.classList.remove("admin-nav-lock");
  }, [navOpen]);

  async function logout() {
    await adminFetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  if (!ready) {
    return (
      <div className="admin-root">
        <div className="admin-main admin-muted">Sessiya tekshirilmoqda…</div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <div className={`admin-shell${navOpen ? " nav-open" : ""}`}>
        <button
          className="admin-backdrop"
          type="button"
          aria-label="Menyuni yopish"
          onClick={() => setNavOpen(false)}
        />
        <aside className="admin-side" id="admin-side-nav">
          <p className="admin-side-brand">
            UnderDog Admin
            <span>Boshqaruv markazi</span>
          </p>
          <nav className="admin-nav" aria-label="Admin menyu">
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
          <div className="admin-side-actions">
            <Link className="admin-btn" href="/">
              Ommaviy sayt
            </Link>
            <button className="admin-btn" type="button" onClick={logout}>
              Chiqish
            </button>
          </div>
        </aside>

        <div className="admin-main">
          <header className="admin-topbar">
            <button
              className="admin-btn icon"
              type="button"
              aria-expanded={navOpen}
              aria-controls="admin-side-nav"
              aria-label={navOpen ? "Menyuni yopish" : "Menyuni ochish"}
              onClick={() => setNavOpen((open) => !open)}
            >
              {navOpen ? "✕" : "☰"}
            </button>
            <div className="admin-topbar-title">{title}</div>
            <Link className="admin-btn ghost" href="/">
              Sayt
            </Link>
          </header>

          <div className="admin-top">
            <h2>{title}</h2>
            <Link className="admin-btn" href="/">
              Ommaviy sayt
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

export function helperStatusLabel(status: string) {
  switch (status) {
    case "running":
      return "ishlamoqda";
    case "paused":
      return "pauzada";
    case "degraded":
      return "zaiflashgan";
    case "unknown":
      return "noma’lum";
    default:
      return status;
  }
}
