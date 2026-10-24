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
      toast.show("So‘rov yaratildi");
      await load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Xatolik");
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
    <AdminShell title="Qidiruv so‘rovlari">
      <div className="admin-panel">
        <form className="admin-row" onSubmit={onCreate}>
          <input
            className="admin-input admin-grow"
            placeholder="So‘rov matni"
            value={form.query}
            onChange={(e) => setForm({ ...form, query: e.target.value })}
            required
          />
          <select
            className="admin-select"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
          >
            <option value="uz">O‘zbek</option>
            <option value="ru">Rus</option>
            <option value="en">Ingliz</option>
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
            className="admin-input admin-grow"
            placeholder="Sinonimlar (vergul bilan)"
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
            aria-label="Prioritet"
            style={{ width: 110 }}
          />
          <button className="admin-btn primary" type="submit">
            So‘rov qo‘shish
          </button>
        </form>
      </div>

      <div className="admin-row admin-toolbar" style={{ marginTop: 12 }}>
        <input
          className="admin-input admin-grow"
          placeholder="So‘rovlarni filtrlash"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button className="admin-btn" type="button" onClick={() => load()}>
          Qidirish
        </button>
      </div>

      <div className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>So‘rov</th>
                <th>Til</th>
                <th>Prioritet</th>
                <th>Statistika</th>
                <th>Holat</th>
                <th>Amallar</th>
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
                    ishga {item.timesRun} / bo‘sh {item.timesEmpty}
                    <br />
                    nomzod {item.candidatesFound} / hamjamiyat{" "}
                    {item.communitiesFound}
                  </td>
                  <td>
                    {item.enabled ? "yoqilgan" : "o‘chirilgan"}
                    <br />
                    {item.autoRun ? "avto" : "qo‘lda"}
                  </td>
                  <td>
                    <div className="admin-actions-col">
                      <button
                        className="admin-btn"
                        type="button"
                        onClick={() =>
                          patch(item.id, { enabled: !item.enabled }).then(() =>
                            toast.show("Yangilandi"),
                          )
                        }
                      >
                        {item.enabled ? "O‘chirish" : "Yoqish"}
                      </button>
                      <button
                        className="admin-btn"
                        type="button"
                        onClick={() =>
                          patch(item.id, { autoRun: !item.autoRun }).then(() =>
                            toast.show("Yangilandi"),
                          )
                        }
                      >
                        {item.autoRun ? "Avtoni o‘chirish" : "Avtoni yoqish"}
                      </button>
                      <button
                        className="admin-btn"
                        type="button"
                        onClick={() =>
                          adminFetch(`/api/admin/queries/${item.id}/run`, {
                            method: "POST",
                            body: "{}",
                          }).then(() =>
                            toast.show("Keyingi sikl uchun navbatga qo‘yildi"),
                          )
                        }
                      >
                        Ishga tushirish
                      </button>
                      <button
                        className="admin-btn danger"
                        type="button"
                        onClick={() => {
                          if (!confirm(`“${item.query}” o‘chirilsinmi?`)) return;
                          adminFetch(`/api/admin/queries/${item.id}`, {
                            method: "DELETE",
                          }).then(() => {
                            toast.show("O‘chirildi");
                            return load();
                          });
                        }}
                      >
                        O‘chirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!items.length ? (
          <div className="admin-muted">
            Hali so‘rovlar yo‘q. Seed ishga tushganda tavsiyalar qo‘shiladi.
          </div>
        ) : null}
      </div>
      {toast.node}
    </AdminShell>
  );
}
