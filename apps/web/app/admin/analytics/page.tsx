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

const RANGES = [
  { id: "24h", label: "24 soat" },
  { id: "7d", label: "7 kun" },
  { id: "30d", label: "30 kun" },
];

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
    <AdminShell title="Analitika">
      <div className="admin-row admin-toolbar">
        <div className="admin-chip-row">
          {RANGES.map((item) => (
            <button
              key={item.id}
              className={`admin-btn ${range === item.id ? "primary" : ""}`}
              type="button"
              onClick={() => setRange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <div className="admin-muted">Analitika yuklanmoqda…</div>
      ) : (
        <>
          <div className="admin-panel">
            <h3>Kunlik qo‘shilgan hamjamiyatlar</h3>
            <div className="admin-table-wrap">
              <table className="admin-table compact">
                <thead>
                  <tr>
                    <th>Kun</th>
                    <th>Qo‘shilgan</th>
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
            </div>
            {!data.dailyAdds.length ? (
              <div className="admin-muted">Bu oralikda qo‘shilishlar yo‘q.</div>
            ) : null}
          </div>

          <div className="admin-panel">
            <h3>Kunlik qayta ishlash tezligi</h3>
            <div className="admin-table-wrap">
              <table className="admin-table compact">
                <thead>
                  <tr>
                    <th>Kun</th>
                    <th>Qayta ishlangan</th>
                    <th>OK</th>
                    <th>Xato</th>
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
          </div>

          <div className="admin-panel">
            <h3>So‘rovlar samaradorligi</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>So‘rov</th>
                    <th>Ishga tushirish</th>
                    <th>Bo‘sh</th>
                    <th>Nomzodlar</th>
                    <th>Hamjamiyatlar</th>
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
          </div>

          <div className="admin-panel">
            <h3>Xato sabablari</h3>
            <div className="admin-table-wrap">
              <table className="admin-table compact">
                <thead>
                  <tr>
                    <th>Sabab</th>
                    <th>Soni</th>
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
            </div>
            {!data.failures.length ? (
              <div className="admin-muted">Bu oralikda xatolar yo‘q.</div>
            ) : null}
          </div>
        </>
      )}
      {toast.node}
    </AdminShell>
  );
}
