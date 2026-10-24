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
  topQueries: Array<{
    query: string;
    communities_found: number;
    candidates_found: number;
  }>;
  helper: {
    paused: boolean;
    heartbeat: { at?: string; updatedAt?: string } | null;
    autoDiscovery: boolean;
  };
};

const RANGES = [
  { id: "24h", label: "24 soat" },
  { id: "7d", label: "7 kun" },
  { id: "30d", label: "30 kun" },
];

export default function AdminOverviewPage() {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    setError("");
    adminFetch<Dashboard>(`/api/admin/dashboard?range=${range}`)
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Yuklash xatosi"),
      );
  }, [range]);

  return (
    <AdminShell title="Umumiy ko‘rinish">
      <div className="admin-row admin-toolbar" style={{ marginBottom: 12 }}>
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
        <button
          className="admin-btn"
          type="button"
          onClick={() => {
            adminFetch<Dashboard>(`/api/admin/dashboard?range=${range}`)
              .then((next) => {
                setData(next);
                toast.show("Yangilandi");
              })
              .catch((err) => toast.show(err.message));
          }}
        >
          Yangilash
        </button>
      </div>

      {error ? <div className="admin-bad">{error}</div> : null}
      {!data && !error ? (
        <div className="admin-muted">Ko‘rsatkichlar yuklanmoqda…</div>
      ) : null}

      {data ? (
        <>
          <div className="admin-grid">
            <div className="admin-card">
              <div className="label">Hamjamiyatlar</div>
              <div className="value">{data.communities.total}</div>
            </div>
            <div className="admin-card">
              <div className="label">Qo‘shilgan (24 soat)</div>
              <div className="value">{data.communities.added24h}</div>
            </div>
            <div className="admin-card">
              <div className="label">Qo‘shilgan (7 kun)</div>
              <div className="value">{data.communities.added7d}</div>
            </div>
            <div className="admin-card">
              <div className="label">Kutayotgan navbat</div>
              <div className="value">{data.candidates.pending}</div>
            </div>
            <div className="admin-card">
              <div className="label">Muvaffaqiyatsiz nomzodlar</div>
              <div className="value">{data.candidates.failed}</div>
            </div>
            <div className="admin-card">
              <div className="label">Muvaffaqiyat foizi</div>
              <div className="value">
                {data.runs.successRate == null
                  ? "mavjud emas"
                  : `${data.runs.successRate}%`}
              </div>
            </div>
            <div className="admin-card">
              <div className="label">Helper</div>
              <div
                className={`value ${data.helper.paused ? "admin-warn" : "admin-ok"}`}
              >
                {data.helper.paused ? "pauzada" : "faol"}
              </div>
            </div>
            <div className="admin-card">
              <div className="label">Oxirgi heartbeat</div>
              <div className="value" style={{ fontSize: "0.95rem" }}>
                {data.helper.heartbeat?.at ||
                  data.helper.heartbeat?.updatedAt ||
                  "noma’lum"}
              </div>
            </div>
          </div>

          <div className="admin-panel">
            <h3>Kategoriya bo‘yicha ({range})</h3>
            {data.byCategory.length ? (
              <div className="admin-table-wrap">
                <table className="admin-table compact">
                  <thead>
                    <tr>
                      <th>Kategoriya</th>
                      <th>Soni</th>
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
              </div>
            ) : (
              <div className="admin-muted">
                Bu oralikda kategoriya ma’lumoti yo‘q.
              </div>
            )}
          </div>

          <div className="admin-panel">
            <h3>Eng samarali so‘rovlar</h3>
            {data.topQueries.length ? (
              <div className="admin-table-wrap">
                <table className="admin-table compact">
                  <thead>
                    <tr>
                      <th>So‘rov</th>
                      <th>Nomzodlar</th>
                      <th>Hamjamiyatlar</th>
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
              </div>
            ) : (
              <div className="admin-muted">Hali so‘rov statistikasi yo‘q.</div>
            )}
          </div>
        </>
      ) : null}
      {toast.node}
    </AdminShell>
  );
}
