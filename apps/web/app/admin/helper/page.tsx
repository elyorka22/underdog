"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useToast } from "@/components/admin/AdminShell";
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
      toast.show(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <AdminShell title="Helper Control">
      {!status ? (
        <div className="admin-muted">Loading helper status…</div>
      ) : (
        <>
          <div className="admin-grid">
            <div className="admin-card">
              <div className="label">Status</div>
              <div className="value">{status.status}</div>
            </div>
            <div className="admin-card">
              <div className="label">Paused</div>
              <div className="value">{status.paused ? "yes" : "no"}</div>
            </div>
            <div className="admin-card">
              <div className="label">Heartbeat age</div>
              <div className="value" style={{ fontSize: "1rem" }}>
                {status.ageMs == null
                  ? "unknown"
                  : `${Math.round(status.ageMs / 1000)}s`}
              </div>
            </div>
            <div className="admin-card">
              <div className="label">Pending</div>
              <div className="value">{status.candidates.pending}</div>
            </div>
            <div className="admin-card">
              <div className="label">Failed</div>
              <div className="value">{status.candidates.failed}</div>
            </div>
            <div className="admin-card">
              <div className="label">Auto-discovery</div>
              <div className="value">
                {String(status.settings.autoDiscovery)}
              </div>
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-row">
              <button
                className="admin-btn"
                type="button"
                onClick={() => action("/api/admin/helper/pause", "Paused")}
              >
                Pause
              </button>
              <button
                className="admin-btn primary"
                type="button"
                onClick={() => action("/api/admin/helper/resume", "Resumed")}
              >
                Resume
              </button>
              <button
                className="admin-btn"
                type="button"
                onClick={() =>
                  action("/api/admin/helper/discover", "Discovery requested")
                }
              >
                Trigger discovery
              </button>
              <button
                className="admin-btn"
                type="button"
                onClick={() =>
                  action(
                    "/api/admin/helper/process-queue",
                    "Queue processing requested",
                  )
                }
              >
                Process queue
              </button>
              <button className="admin-btn" type="button" onClick={() => load()}>
                Refresh
              </button>
            </div>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              Pause/resume and settings apply through the database. Helper picks
              them up on the next tick — no Docker rebuild needed. Start/stop of
              the container itself is done via Docker Compose on the server.
            </p>
          </div>

          <div className="admin-panel">
            <h3 style={{ marginTop: 0 }}>Runtime settings (live)</h3>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(status.settings, null, 2)}
            </pre>
          </div>

          <div className="admin-panel">
            <h3 style={{ marginTop: 0 }}>Recent runs</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>Processed</th>
                  <th>OK</th>
                  <th>Fail</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td>{new Date(run.startedAt).toLocaleString()}</td>
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
        </>
      )}
      {toast.node}
    </AdminShell>
  );
}
