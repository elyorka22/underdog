"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminShell,
  helperStatusLabel,
  useToast,
} from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-api";

type HelperStatus = {
  status: string;
  paused: boolean;
  ageMs: number | null;
  settings: Record<string, number | boolean | string>;
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

export default function AdminHelperPage() {
  const [status, setStatus] = useState<HelperStatus | null>(null);
  const [runs, setRuns] = useState<RunItem[]>([]);
  const toast = useToast();

  const load = useCallback(async () => {
    const [nextStatus, nextRuns] = await Promise.all([
      adminFetch<HelperStatus>("/api/admin/helper/status"),
      adminFetch<{ items: RunItem[] }>("/api/admin/helper/runs?limit=20"),
    ]);
    setStatus(nextStatus);
    setRuns(nextRuns.items);
  }, []);

  useEffect(() => {
    load().catch((err) => toast.show(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast.show is stable setState
  }, [load]);

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
              Konteynerni to‘liq to‘xtatish serverda Docker Compose orqali
              qilinadi.
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
