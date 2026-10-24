"use client";

import { useEffect, useState } from "react";
import { AdminShell, useToast } from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-api";

export default function AdminOperationsPage() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [events, setEvents] = useState<
    Array<{
      id: number;
      type: string;
      createdAt: string;
      payload: Record<string, unknown>;
    }>
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
    <AdminShell title="Operatsiyalar / diagnostika">
      <div className="admin-row admin-toolbar">
        <button className="admin-btn" type="button" onClick={() => load()}>
          Yangilash
        </button>
      </div>

      <div className="admin-panel">
        <h3>Tizim holati</h3>
        {!health ? (
          <div className="admin-muted">Yuklanmoqda…</div>
        ) : (
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              fontSize: "0.85rem",
              overflowWrap: "anywhere",
            }}
          >
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
        <p className="admin-muted">
          Maxfiy ma’lumotlar hech qachon qaytarilmaydi. Botning jonli holati
          alohida jarayonni talab qiladi va log yo‘qligidan xulosa chiqarilmaydi.
        </p>
      </div>

      <div className="admin-panel">
        <h3>So‘nggi faoliyat (qisqartirilgan)</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vaqt</th>
                <th>Tur</th>
                <th>Ma’lumot</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{new Date(event.createdAt).toLocaleString("uz-UZ")}</td>
                  <td>{event.type}</td>
                  <td>
                    <code>{JSON.stringify(event.payload)}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!events.length ? (
          <div className="admin-muted">Hali helper hodisalari yo‘q.</div>
        ) : null}
      </div>
      {toast.node}
    </AdminShell>
  );
}
