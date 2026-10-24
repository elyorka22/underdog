"use client";

import { useEffect, useState } from "react";
import { AdminShell, useToast } from "@/components/admin/AdminShell";
import { adminFetch, getAdminApiBase } from "@/lib/admin-api";

type Community = {
  id: string;
  username: string;
  title: string;
  type: string;
  categoryId: string;
  membersCount: number;
  source: string;
  flagged: boolean;
  visibility: string;
  telegramUrl: string;
  createdAt: string;
};

export default function AdminCommunitiesPage() {
  const [items, setItems] = useState<Community[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const toast = useToast();

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    params.set("limit", "50");
    const data = await adminFetch<{ items: Community[]; total: number }>(
      `/api/admin/communities?${params}`,
    );
    setItems(data.items);
    setTotal(data.total);
  }

  useEffect(() => {
    load().catch((err) => toast.show(err.message));
  }, []);

  return (
    <AdminShell title="Hamjamiyatlar katalogi">
      <div className="admin-row admin-toolbar">
        <input
          className="admin-input admin-grow"
          placeholder="Nom yoki username bo‘yicha qidirish"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="admin-select"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Barcha turlar</option>
          <option value="channel">kanal</option>
          <option value="group">guruh</option>
        </select>
        <button className="admin-btn" type="button" onClick={() => load()}>
          Qo‘llash
        </button>
        <button
          className="admin-btn"
          type="button"
          onClick={async () => {
            try {
              const params = new URLSearchParams();
              if (q) params.set("q", q);
              if (type) params.set("type", type);
              const response = await fetch(
                `${getAdminApiBase()}/api/admin/communities/export.csv?${params}`,
                { credentials: "include" },
              );
              if (!response.ok) throw new Error("Eksport muvaffaqiyatsiz");
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "underdog-communities.csv";
              link.click();
              URL.revokeObjectURL(url);
            } catch (err) {
              toast.show(
                err instanceof Error ? err.message : "Eksport muvaffaqiyatsiz",
              );
            }
          }}
        >
          CSV yuklab olish
        </button>
      </div>

      <div className="admin-panel">
        <div className="admin-muted" style={{ marginBottom: 8 }}>
          Jami: {total}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Tur</th>
                <th>A’zolar</th>
                <th>Manba</th>
                <th>Belgi</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <div className="admin-muted">@{item.username}</div>
                  </td>
                  <td>{item.type === "channel" ? "kanal" : "guruh"}</td>
                  <td>{item.membersCount.toLocaleString("uz-UZ")}</td>
                  <td>{item.source}</td>
                  <td>
                    {item.flagged ? "belgilangan" : "normal"} / {item.visibility}
                  </td>
                  <td>
                    <div className="admin-actions-col">
                      <a
                        className="admin-btn"
                        href={item.telegramUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ochish
                      </a>
                      <button
                        className="admin-btn"
                        type="button"
                        onClick={() =>
                          adminFetch(`/api/admin/communities/${item.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ flagged: !item.flagged }),
                          }).then(() => load())
                        }
                      >
                        {item.flagged ? "Belgini olish" : "Belgilash"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {toast.node}
    </AdminShell>
  );
}
