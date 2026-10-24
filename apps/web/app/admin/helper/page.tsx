"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminShell,
  helperStatusLabel,
  useToast,
} from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-api";

type HelperFocus = {
  categoryId: string;
  categoryTitle: string;
  type: string;
  minutes: number;
  startedAt: string;
  until: string;
  remainingMs: number;
};

type HelperStatus = {
  status: string;
  paused: boolean;
  ageMs: number | null;
  settings: Record<string, number | boolean | string>;
  focus: HelperFocus | null;
  candidates: Record<string, number>;
  lastRun: {
    started_at?: string;
    finished_at?: string;
    processed?: number;
    succeeded?: number;
    failed?: number;
    notes?: string;
  } | null;
};

type RunItem = {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  processed: number;
  succeeded: number;
  failed: number;
  notes: string | null;
  durationMs: number | null;
};

type Category = {
  id: string;
  title: string;
  appliesTo?: string[];
};

const TYPE_OPTIONS = [
  { id: "channel", label: "Kanallar" },
  { id: "group", label: "Chatlar" },
  { id: "bot", label: "Botlar" },
  { id: "all", label: "Hammasi" },
] as const;

function typeLabel(type: string) {
  return TYPE_OPTIONS.find((item) => item.id === type)?.label || type;
}

function formatRemaining(ms: number) {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s}s`;
}

export default function AdminHelperPage() {
  const [status, setStatus] = useState<HelperStatus | null>(null);
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [focusType, setFocusType] = useState("group");
  const [focusCategoryId, setFocusCategoryId] = useState("");
  const [focusMinutes, setFocusMinutes] = useState(30);
  const [savingFocus, setSavingFocus] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    const [nextStatus, nextRuns, nextCategories] = await Promise.all([
      adminFetch<HelperStatus>("/api/admin/helper/status"),
      adminFetch<{ items: RunItem[] }>("/api/admin/helper/runs?limit=20"),
      adminFetch<{ items: Category[] }>("/api/admin/categories"),
    ]);
    setStatus(nextStatus);
    setRuns(nextRuns.items);
    setCategories(nextCategories.items);
    setFocusCategoryId((current) => current || nextCategories.items[0]?.id || "");
  }, []);

  useEffect(() => {
    load().catch((err) => toast.show(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast.show is stable setState
  }, [load]);

  const visibleCategories = categories.filter((item) => {
    if (focusType === "all") return true;
    const applies = item.appliesTo || ["channel", "group"];
    return applies.includes(focusType);
  });

  async function action(path: string, label: string) {
    try {
      const result = await adminFetch<{ message?: string }>(path, {
        method: "POST",
        body: "{}",
      });
      toast.show(result.message || label);
      await load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Xatolik");
    }
  }

  async function startFocus() {
    if (!focusCategoryId) {
      toast.show("Kategoriyani tanlang");
      return;
    }
    setSavingFocus(true);
    try {
      const result = await adminFetch<{ message?: string }>(
        "/api/admin/helper/focus",
        {
          method: "POST",
          body: JSON.stringify({
            categoryId: focusCategoryId,
            type: focusType,
            minutes: focusMinutes,
          }),
        },
      );
      toast.show(result.message || "Yo‘naltirish yoqildi");
      await load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setSavingFocus(false);
    }
  }

  async function clearFocus() {
    setSavingFocus(true);
    try {
      const result = await adminFetch<{ message?: string }>(
        "/api/admin/helper/focus",
        { method: "DELETE" },
      );
      toast.show(result.message || "Yo‘naltirish to‘xtatildi");
      await load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setSavingFocus(false);
    }
  }

  return (
    <AdminShell title="Helper boshqaruvi">
      {!status ? (
        <div className="admin-muted">Helper holati yuklanmoqda…</div>
      ) : (
        <>
          <div className="admin-grid">
            <div className="admin-card">
              <div className="label">Holat</div>
              <div className="value">{helperStatusLabel(status.status)}</div>
            </div>
            <div className="admin-card">
              <div className="label">Pauza</div>
              <div className="value">{status.paused ? "ha" : "yo‘q"}</div>
            </div>
            <div className="admin-card">
              <div className="label">Heartbeat yoshi</div>
              <div className="value" style={{ fontSize: "1rem" }}>
                {status.ageMs == null
                  ? "noma’lum"
                  : `${Math.round(status.ageMs / 1000)}s`}
              </div>
            </div>
            <div className="admin-card">
              <div className="label">Kutayotgan</div>
              <div className="value">{status.candidates.pending}</div>
            </div>
            <div className="admin-card">
              <div className="label">Muvaffaqiyatsiz</div>
              <div className="value">{status.candidates.failed}</div>
            </div>
            <div className="admin-card">
              <div className="label">Avto-qidiruv</div>
              <div className="value">
                {status.settings.autoDiscovery ? "yoqilgan" : "o‘chirilgan"}
              </div>
            </div>
          </div>

          <div className="admin-panel">
            <h3>Qo‘lda yo‘naltirish</h3>
            <p className="admin-muted">
              Belgilangan daqiqalar davomida helper faqat tanlangan kategoriya va
              tur (kanal / chat / bot) bo‘yicha qidiradi. Vaqt tugagach avto-rejimga
              qaytadi.
            </p>

            {status.focus ? (
              <div
                className="admin-card"
                style={{ marginBottom: 12, maxWidth: 520 }}
              >
                <div className="label">Hozir faol</div>
                <div className="value" style={{ fontSize: "1.1rem" }}>
                  {status.focus.categoryTitle} · {typeLabel(status.focus.type)}
                </div>
                <div className="admin-muted" style={{ marginTop: 6 }}>
                  Qolgan: {formatRemaining(status.focus.remainingMs)} · tugaydi{" "}
                  {new Date(status.focus.until).toLocaleString("uz-UZ")}
                </div>
                <button
                  className="admin-btn"
                  type="button"
                  style={{ marginTop: 10 }}
                  disabled={savingFocus}
                  onClick={() => clearFocus()}
                >
                  Yo‘naltirishni to‘xtatish
                </button>
              </div>
            ) : null}

            <div className="admin-actions-col" style={{ gap: 10 }}>
              <label className="admin-muted">
                Tur
                <select
                  className="admin-select"
                  value={focusType}
                  onChange={(event) => {
                    const next = event.target.value;
                    setFocusType(next);
                    const nextCats = categories.filter((item) => {
                      if (next === "all") return true;
                      return (item.appliesTo || ["channel", "group"]).includes(
                        next,
                      );
                    });
                    if (
                      nextCats.length &&
                      !nextCats.some((item) => item.id === focusCategoryId)
                    ) {
                      setFocusCategoryId(nextCats[0].id);
                    }
                  }}
                >
                  {TYPE_OPTIONS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-muted">
                Kategoriya
                <select
                  className="admin-select"
                  value={focusCategoryId}
                  onChange={(event) => setFocusCategoryId(event.target.value)}
                >
                  {visibleCategories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({item.id})
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-muted">
                Daqiqalar (1–720)
                <input
                  className="admin-input"
                  type="number"
                  min={1}
                  max={720}
                  value={focusMinutes}
                  onChange={(event) =>
                    setFocusMinutes(Number(event.target.value) || 1)
                  }
                />
              </label>

              <button
                className="admin-btn primary"
                type="button"
                disabled={savingFocus || !visibleCategories.length}
                onClick={() => startFocus()}
              >
                {savingFocus ? "Saqlanmoqda…" : "Yo‘naltirishni boshlash"}
              </button>
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-actions-col">
              <button
                className="admin-btn"
                type="button"
                onClick={() => action("/api/admin/helper/pause", "Pauza qilindi")}
              >
                Pauza
              </button>
              <button
                className="admin-btn primary"
                type="button"
                onClick={() =>
                  action("/api/admin/helper/resume", "Davom ettirildi")
                }
              >
                Davom ettirish
              </button>
              <button
                className="admin-btn"
                type="button"
                onClick={() =>
                  action("/api/admin/helper/discover", "Qidiruv so‘raldi")
                }
              >
                Qidiruvni ishga tushirish
              </button>
              <button
                className="admin-btn"
                type="button"
                onClick={() =>
                  action(
                    "/api/admin/helper/process-queue",
                    "Navbat qayta ishlash so‘raldi",
                  )
                }
              >
                Navbatni qayta ishlash
              </button>
              <button className="admin-btn" type="button" onClick={() => load()}>
                Yangilash
              </button>
            </div>
            <p className="admin-muted" style={{ marginBottom: 0, marginTop: 12 }}>
              Pauza va sozlamalar ma’lumotlar bazasi orqali qo‘llanadi. Helper
              keyingi siklda o‘qiydi — Docker qayta build qilish shart emas.
            </p>
          </div>

          <div className="admin-panel">
            <h3>Joriy sozlamalar</h3>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
              {JSON.stringify(status.settings, null, 2)}
            </pre>
          </div>

          <div className="admin-panel">
            <h3>So‘nggi ishga tushirishlar</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Boshlangan</th>
                    <th>Davomiylik</th>
                    <th>Qayta ishlangan</th>
                    <th>OK</th>
                    <th>Xato</th>
                    <th>Izoh</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id}>
                      <td>{new Date(run.startedAt).toLocaleString("uz-UZ")}</td>
                      <td>
                        {run.durationMs == null
                          ? "—"
                          : `${Math.round(run.durationMs / 1000)}s`}
                      </td>
                      <td>{run.processed}</td>
                      <td>{run.succeeded}</td>
                      <td>{run.failed}</td>
                      <td>{run.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {toast.node}
    </AdminShell>
  );
}
