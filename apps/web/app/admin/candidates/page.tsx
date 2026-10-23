"use client";

import { useEffect, useState } from "react";
import { AdminShell, useToast } from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-api";

type Candidate = {
  id: number;
  username: string;
  title: string | null;
  source: string;
  sourceQuery: string | null;
  status: string;
  attempts: number;
  lastError: string | null;
};

export default function AdminCandidatesPage() {
  const [items, setItems] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const toast = useToast();

  async function load() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    params.set("limit", "50");
    const data = await adminFetch<{ items: Candidate[]; total: number }>(
      `/api/admin/candidates?${params}`,
    );
    setItems(data.items);
    setTotal(data.total);
    setSelected([]);
  }

  useEffect(() => {
    load().catch((err) => toast.show(err.message));
  }, []);

  function toggle(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  async function retrySelected() {
    if (!selected.length) return;
    await adminFetch("/api/admin/candidates/retry", {
      method: "POST",
      body: JSON.stringify({ ids: selected }),
    });
    toast.show(`Retried ${selected.length}`);
    await load();
  }

  async function dismissSelected() {
    if (!selected.length) return;
    if (!confirm(`Dismiss ${selected.length} candidates?`)) return;
    await adminFetch("/api/admin/candidates/dismiss", {
      method: "POST",
      body: JSON.stringify({ ids: selected }),
    });
    toast.show(`Dismissed ${selected.length}`);
    await load();
  }

  return (
    <AdminShell title="Candidate Queue">
      <div className="admin-row">
        <input
          className="admin-input"
          placeholder="Search username"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="admin-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending">pending</option>
          <option value="processing">processing</option>
          <option value="done">done</option>
          <option value="failed">failed</option>
          <option value="skipped">skipped</option>
        </select>
        <button className="admin-btn" type="button" onClick={() => load()}>
          Apply
        </button>
        <button className="admin-btn" type="button" onClick={retrySelected}>
          Retry selected
        </button>
        <button className="admin-btn danger" type="button" onClick={dismissSelected}>
          Dismiss selected
        </button>
      </div>

      <div className="admin-panel">
        <div className="admin-muted" style={{ marginBottom: 8 }}>
          Total: {total}
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>Username</th>
              <th>Status</th>
              <th>Source</th>
              <th>Attempts</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                </td>
                <td>
                  @{item.username}
                  {item.title ? (
                    <div className="admin-muted">{item.title}</div>
                  ) : null}
                </td>
                <td>{item.status}</td>
                <td>
                  {item.source}
                  {item.sourceQuery ? (
                    <div className="admin-muted">{item.sourceQuery}</div>
                  ) : null}
                </td>
                <td>{item.attempts}</td>
                <td className="admin-bad">{item.lastError || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length ? <div className="admin-muted">Queue is empty.</div> : null}
      </div>
      {toast.node}
    </AdminShell>
  );
}
