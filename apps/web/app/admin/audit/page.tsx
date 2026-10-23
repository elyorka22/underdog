"use client";

import { useEffect, useState } from "react";
import { AdminShell, useToast } from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-api";

type AuditItem = {
  id: number;
  actor: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  meta: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
};

export default function AdminAuditPage() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const toast = useToast();

  useEffect(() => {
    adminFetch<{ items: AuditItem[] }>("/api/admin/audit?limit=100")
      .then((data) => setItems(data.items))
      .catch((err) => toast.show(err.message));
  }, []);

  return (
    <AdminShell title="Audit Log">
      <div className="admin-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Meta</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>{item.actor}</td>
                <td>{item.action}</td>
                <td>
                  {item.entity || "—"}
                  {item.entityId ? ` #${item.entityId}` : ""}
                </td>
                <td>
                  <code>{JSON.stringify(item.meta || {})}</code>
                </td>
                <td>{item.ip || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length ? (
          <div className="admin-muted">No audit events yet.</div>
        ) : null}
      </div>
      {toast.node}
    </AdminShell>
  );
}
