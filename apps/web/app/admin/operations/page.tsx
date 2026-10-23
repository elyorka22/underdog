"use client";

import { useEffect, useState } from "react";
import { AdminShell, useToast } from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-api";

export default function AdminOperationsPage() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [events, setEvents] = useState<
    Array<{ id: number; type: string; createdAt: string; payload: Record<string, unknown> }>
  >([]);
  const toast = useToast();

  async function load() {
    const [nextHealth, nextEvents] = await Promise.all([
      adminFetch<Record<string, unknown>>("/api/admin/health"),
      adminFetch<{ items: typeof events }>("/api/admin/events?limit=40"),
    ]);
    setHealth(nextHealth);
    setEvents(nextEvents.items);
  }

  useEffect(() => {
    load().catch((err) => toast.show(err.message));
  }, []);

  return (
    <AdminShell title="Operations / Diagnostics">
      <div className="admin-row">
        <button className="admin-btn" type="button" onClick={() => load()}>
          Refresh
        </button>
      </div>

      <div className="admin-panel">
        <h3 style={{ marginTop: 0 }}>Health</h3>
        {!health ? (
          <div className="admin-muted">Loading…</div>
        ) : (
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
        <p className="admin-muted">
          Secrets are never returned. Bot live status requires a running bot
          process and is not inferred from missing logs alone.
        </p>
      </div>

      <div className="admin-panel">
        <h3 style={{ marginTop: 0 }}>Recent activity (redacted)</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Type</th>
              <th>Payload</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{new Date(event.createdAt).toLocaleString()}</td>
                <td>{event.type}</td>
                <td>
                  <code>{JSON.stringify(event.payload)}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!events.length ? (
          <div className="admin-muted">No helper events yet.</div>
        ) : null}
      </div>
      {toast.node}
    </AdminShell>
  );
}
