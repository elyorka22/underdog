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
    <AdminShell title="Categories">
      <div className="admin-panel">
        <p className="admin-muted">
          Categories come from the existing catalog table. Assign queries to
          these categories on the Search Queries page.
        </p>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Communities</th>
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
      {toast.node}
    </AdminShell>
  );
}
