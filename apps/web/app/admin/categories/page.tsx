"use client";

import { useEffect, useState } from "react";
import { AdminShell, useToast } from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-api";

type Category = {
  id: string;
  title: string;
  description: string;
  count: number;
};

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const toast = useToast();

  useEffect(() => {
    adminFetch<{ items: Category[] }>("/api/admin/categories")
      .then((data) => setItems(data.items))
      .catch((err) => toast.show(err.message));
  }, []);

  return (
    <AdminShell title="Kategoriyalar">
      <div className="admin-panel">
        <p className="admin-muted">
          Kategoriyalar katalog jadvalidan olinadi. So‘rovlarni ularga «Qidiruv
          so‘rovlari» sahifasida biriktiring.
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table compact">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Tavsif</th>
                <th>Hamjamiyatlar</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.title}</td>
                  <td>{item.description}</td>
                  <td>{item.count}</td>
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
