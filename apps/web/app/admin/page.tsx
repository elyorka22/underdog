"use client";

import { useEffect, useState } from "react";
import { AdminShell, useToast } from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-api";

type Dashboard = {
  range: string;
  communities: {
    total: number;
    added24h: number;
    added7d: number;
    addedInRange: number;
  };
  candidates: {
    pending: number;
    processing: number;
    done: number;
    failed: number;
    total: number;
  };
  runs: {
    count: number;
    processed: number;
    succeeded: number;
    failed: number;
    successRate: number | null;
  };
  byCategory: Array<{ category: string; count: number }>;
  topQueries: Array<{ query: string; communities_found: number; candidates_found: number }>;
  recentEvents: Array<{ type: string; createdAt: string; payload: Record<string, unknown> }>;
  helper: {
    paused: boolean;
    heartbeat: { at?: string; updatedAt?: string } | null;
    autoDiscovery: boolean;
  };
};

export default function AdminOverviewPage() {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    setError("");
    adminFetch<Dashboard>(`/api/admin/dashboard?range=${range}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, [range]);

  return (
    <AdminShell title="Overview">
      <div className="admin-row" style={{ marginBottom: 12 }}>
        {["24h", "7d", "30d"].map((item) => (
          <button
            key={item}
            className={`admin-btn ${range === item ? "primary" : ""}`}
            type="button"
            onClick={() => setRange(item)}
          >
            {item}
          </button>
        ))}
        <button
          className="admin-btn"
          type="button"
          onClick={() => {
            adminFetch<Dashboard>(`/api/admin/dashboard?range=${range}`)
              .then((next) => {
                setData(next);
                toast.show("Dashboard refreshed");
              })
              .catch((err) => toast.show(err.message));
          }}
        >
          Refresh
        </button>
      </div>

      {error ? <div className="admin-bad">{error}</div> : null}
      {!data && !error ? <div className="admin-muted">Loading metrics…</div> : null}

      {data ? (
        <>
          <div className="admin-grid">
            <div className="admin-card">
              <div className="label">Communities</div>
              <div className="value">{data.communities.total}</div>
            </div>
            <div className="admin-card">
              <div className="label">Added 24h</div>
              <div className="value">{data.communities.added24h}</div>
            </div>
            <div className="admin-card">
              <div className="label">Added 7d</div>
              <div className="value">{data.communities.added7d}</div>
            </div>
            <div className="admin-card">
              <div className="label">Pending queue</div>
              <div className="value">{data.candidates.pending}</div>
            </div>
            <div className="admin-card">
              <div className="label">Failed candidates</div>
              <div className="value">{data.candidates.failed}</div>
            </div>
            <div className="admin-card">
              <div className="label">Success rate</div>
              <div className="value">
                {data.runs.successRate == null ? "n/a" : `${data.runs.successRate}%`}
              </div>
            </div>
            <div className="admin-card">
              <div className="label">Helper</div>
              <div className={`value ${data.helper.paused ? "admin-warn" : "admin-ok"}`}>
                {data.helper.paused ? "paused" : "active"}
              </div>
            </div>
            <div className="admin-card">
              <div className="label">Last heartbeat</div>
              <div className="value" style={{ fontSize: "0.95rem" }}>
                {data.helper.heartbeat?.at ||
                  data.helper.heartbeat?.updatedAt ||
                  "unknown"}
              </div>
            </div>
          </div>

          <div className="admin-panel">
            <h3 style={{ marginTop: 0 }}>By category ({range})</h3>
            {data.byCategory.length ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byCategory.map((row) => (
                    <tr key={row.category}>
                      <td>{row.category}</td>
                      <td>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="admin-muted">No category data in this range.</div>
            )}
          </div>

          <div className="admin-panel">
            <h3 style={{ marginTop: 0 }}>Top queries</h3>
            {data.topQueries.length ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Query</th>
                    <th>Candidates</th>
                    <th>Communities</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topQueries.map((row) => (
                    <tr key={row.query}>
                      <td>{row.query}</td>
                      <td>{row.candidates_found}</td>
                      <td>{row.communities_found}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="admin-muted">No query stats yet.</div>
            )}
          </div>
        </>
      ) : null}
      {toast.node}
    </AdminShell>
  );
}
