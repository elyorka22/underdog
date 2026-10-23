"use client";

import { useEffect, useState } from "react";
import { AdminShell, useToast } from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-api";

type Analytics = {
  range: string;
  dailyAdds: Array<{ day: string; count: number }>;
  dailyRuns: Array<{
    day: string;
    processed: number;
    succeeded: number;
    failed: number;
  }>;
  byCategory: Array<{ label: string; count: number }>;
  byLanguage: Array<{ label: string; count: number }>;
  byQuery: Array<{
    label: string;
    candidates_found: number;
    communities_found: number;
    times_run: number;
    times_empty: number;
  }>;
  failures: Array<{ label: string; count: number }>;
};

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<Analytics | null>(null);
  const toast = useToast();

  useEffect(() => {
    adminFetch<Analytics>(`/api/admin/analytics?range=${range}`)
      .then(setData)
      .catch((err) => toast.show(err.message));
  }, [range]);

  return (
    <AdminShell title="Analytics">
      <div className="admin-row">
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
      </div>

      {!data ? (
        <div className="admin-muted">Loading analytics…</div>
      ) : (
        <>
          <div className="admin-panel">
            <h3 style={{ marginTop: 0 }}>Community additions / day</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {data.dailyAdds.map((row) => (
                  <tr key={String(row.day)}>
                    <td>{String(row.day).slice(0, 10)}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.dailyAdds.length ? (
              <div className="admin-muted">No additions in range.</div>
            ) : null}
          </div>

          <div className="admin-panel">
            <h3 style={{ marginTop: 0 }}>Processing throughput / day</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Processed</th>
                  <th>OK</th>
                  <th>Fail</th>
                </tr>
              </thead>
              <tbody>
                {data.dailyRuns.map((row) => (
                  <tr key={String(row.day)}>
                    <td>{String(row.day).slice(0, 10)}</td>
                    <td>{row.processed}</td>
                    <td>{row.succeeded}</td>
                    <td>{row.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-panel">
            <h3 style={{ marginTop: 0 }}>By query productivity</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Query</th>
                  <th>Runs</th>
                  <th>Empty</th>
                  <th>Candidates</th>
                  <th>Communities</th>
                </tr>
              </thead>
              <tbody>
                {data.byQuery.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.times_run}</td>
                    <td>{row.times_empty}</td>
                    <td>{row.candidates_found}</td>
                    <td>{row.communities_found}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-panel">
            <h3 style={{ marginTop: 0 }}>Failure reasons</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reason</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {data.failures.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.failures.length ? (
              <div className="admin-muted">No failures in range.</div>
            ) : null}
          </div>
        </>
      )}
      {toast.node}
    </AdminShell>
  );
}
