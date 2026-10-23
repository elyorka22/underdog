"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminShell, useToast } from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-api";

type QueryItem = {
  id: number;
  query: string;
  language: string;
  categoryId: string | null;
  synonyms: string[];
  enabled: boolean;
  autoRun: boolean;
  priority: number;
  timesRun: number;
  timesEmpty: number;
  candidatesFound: number;
  communitiesFound: number;
  lastRunAt: string | null;
};

type Category = { id: string; title: string };

export default function AdminQueriesPage() {
  const [items, setItems] = useState<QueryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    query: "",
    language: "uz",
    categoryId: "tech",
    synonyms: "",
    priority: 100,
  });
  const toast = useToast();

  async function load() {
    const [queries, cats] = await Promise.all([
      adminFetch<{ items: QueryItem[] }>(
        `/api/admin/queries?q=${encodeURIComponent(filter)}`,
      ),
      adminFetch<{ items: Category[] }>("/api/admin/categories"),
    ]);
    setItems(queries.items);
    setCategories(cats.items);
  }

  useEffect(() => {
    load().catch((err) => toast.show(err.message));
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    try {
      await adminFetch("/api/admin/queries", {
        method: "POST",
        body: JSON.stringify({
          query: form.query,
          language: form.language,
          categoryId: form.categoryId,
          priority: Number(form.priority),
          synonyms: form.synonyms
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        }),
      });
      setForm({
        query: "",
        language: "uz",
        categoryId: "tech",
        synonyms: "",
        priority: 100,
      });
      toast.show("Query created");
      await load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Failed");
    }
  }

  async function patch(id: number, body: Record<string, unknown>) {
    await adminFetch(`/api/admin/queries/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    await load();
  }

  return (
    <AdminShell title="Search Queries">
      <div className="admin-panel">
        <form className="admin-row" onSubmit={onCreate}>
          <input
            className="admin-input"
            placeholder="Query"
            value={form.query}
            onChange={(e) => setForm({ ...form, query: e.target.value })}
            required
          />
          <select
            className="admin-select"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
          >
            <option value="uz">uz</option>
            <option value="ru">ru</option>
            <option value="en">en</option>
          </select>
          <select
            className="admin-select"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.title}
              </option>
            ))}
          </select>
          <input
            className="admin-input"
            placeholder="Synonyms, comma-separated"
            value={form.synonyms}
            onChange={(e) => setForm({ ...form, synonyms: e.target.value })}
          />
          <input
            className="admin-input"
            type="number"
            value={form.priority}
            onChange={(e) =>
              setForm({ ...form, priority: Number(e.target.value) })
            }
            style={{ width: 90 }}
          />
          <button className="admin-btn primary" type="submit">
            Add query
          </button>
        </form>
      </div>

      <div className="admin-row" style={{ marginTop: 12 }}>
        <input
          className="admin-input"
          placeholder="Filter queries"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button className="admin-btn" type="button" onClick={() => load()}>
          Search
        </button>
      </div>

      <div className="admin-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Query</th>
              <th>Lang</th>
              <th>Priority</th>
              <th>Stats</th>
              <th>Flags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.query}</strong>
                  <div className="admin-muted">{item.categoryId || "—"}</div>
                </td>
                <td>{item.language}</td>
                <td>{item.priority}</td>
                <td>
                  run {item.timesRun} / empty {item.timesEmpty}
                  <br />
                  cand {item.candidatesFound} / comm {item.communitiesFound}
                </td>
                <td>
                  {item.enabled ? "enabled" : "disabled"}
                  <br />
                  {item.autoRun ? "auto" : "manual"}
                </td>
                <td className="admin-row">
                  <button
                    className="admin-btn"
                    type="button"
                    onClick={() =>
                      patch(item.id, { enabled: !item.enabled }).then(() =>
                        toast.show("Updated"),
                      )
                    }
                  >
                    {item.enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    className="admin-btn"
                    type="button"
                    onClick={() =>
                      patch(item.id, { autoRun: !item.autoRun }).then(() =>
                        toast.show("Updated"),
                      )
                    }
                  >
                    {item.autoRun ? "Auto off" : "Auto on"}
                  </button>
                  <button
                    className="admin-btn"
                    type="button"
                    onClick={() =>
                      adminFetch(`/api/admin/queries/${item.id}/run`, {
                        method: "POST",
                        body: "{}",
                      }).then(() => toast.show("Queued for next tick"))
                    }
                  >
                    Run
                  </button>
                  <button
                    className="admin-btn danger"
                    type="button"
                    onClick={() => {
                      if (!confirm(`Delete query "${item.query}"?`)) return;
                      adminFetch(`/api/admin/queries/${item.id}`, {
                        method: "DELETE",
                      }).then(() => {
                        toast.show("Deleted");
                        return load();
                      });
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length ? (
          <div className="admin-muted">No queries yet. Seed runs on migrate/seed.</div>
        ) : null}
      </div>
      {toast.node}
    </AdminShell>
  );
}
