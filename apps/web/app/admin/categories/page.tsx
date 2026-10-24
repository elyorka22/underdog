"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminShell, useToast } from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-api";

type Category = {
  id: string;
  title: string;
  description: string;
  appliesTo?: string[];
  count: number;
};

const APPLY_OPTIONS = [
  { id: "channel", label: "Kanallar" },
  { id: "group", label: "Chatlar" },
  { id: "bot", label: "Botlar" },
] as const;

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [id, setId] = useState("");
  const [description, setDescription] = useState("");
  const [appliesTo, setAppliesTo] = useState<string[]>(["channel", "group"]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toast = useToast();

  async function load() {
    const data = await adminFetch<{ items: Category[] }>(
      "/api/admin/categories",
    );
    setItems(data.items);
  }

  useEffect(() => {
    load().catch((err) => toast.show(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast.show is stable setState
  }, []);

  function toggleApply(value: string) {
    setAppliesTo((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      toast.show("Nom majburiy");
      return;
    }
    if (!appliesTo.length) {
      toast.show("Kamida bitta tur tanlang");
      return;
    }
    setSaving(true);
    try {
      await adminFetch("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          id: id.trim() || undefined,
          description: description.trim(),
          appliesTo,
        }),
      });
      toast.show("Kategoriya yaratildi");
      setTitle("");
      setId("");
      setDescription("");
      setAppliesTo(["channel", "group"]);
      await load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(item: Category) {
    const ok = window.confirm(
      `"${item.title}" kategoriyasini o‘chirasizmi?\nHamjamiyatlar va so‘rovlardan bog‘lanish olib tashlanadi.`,
    );
    if (!ok) return;
    setDeletingId(item.id);
    try {
      await adminFetch(`/api/admin/categories/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      toast.show("Kategoriya o‘chirildi");
      await load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminShell title="Kategoriyalar">
      <div className="admin-panel">
        <h3>Yangi kategoriya</h3>
        <p className="admin-muted">
          Yangi kategoriya sayt, bot va helper yo‘naltirishida paydo bo‘ladi.
          Keyin «Qidiruv so‘rovlari»da shu kategoriyaga so‘rov bog‘lash mumkin.
        </p>
        <form className="admin-actions-col" onSubmit={onCreate} style={{ gap: 10 }}>
          <label className="admin-muted">
            Nom
            <input
              className="admin-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Masalan: Tanishuv premium"
              required
            />
          </label>
          <label className="admin-muted">
            ID (ixtiyoriy)
            <input
              className="admin-input"
              value={id}
              onChange={(event) => setId(event.target.value)}
              placeholder="dating_premium — bo‘sh qoldirilsa nomdan"
            />
          </label>
          <label className="admin-muted">
            Tavsif
            <input
              className="admin-input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Qisqa tavsif"
            />
          </label>
          <div className="admin-muted">
            Qaysi turlarga tegishli
            <div className="admin-actions-col" style={{ marginTop: 6 }}>
              {APPLY_OPTIONS.map((item) => (
                <label key={item.id} style={{ display: "flex", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={appliesTo.includes(item.id)}
                    onChange={() => toggleApply(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
          <button className="admin-btn primary" type="submit" disabled={saving}>
            {saving ? "Saqlanmoqda…" : "Kategoriya yaratish"}
          </button>
        </form>
      </div>

      <div className="admin-panel">
        <p className="admin-muted">
          Mavjud kategoriyalar. Helper «Helper» sahifasida shu ro‘yxatdan
          yo‘naltiriladi.
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table compact">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Tavsif</th>
                <th>Turlar</th>
                <th>Hamjamiyatlar</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.title}</td>
                  <td>{item.description}</td>
                  <td>
                    {(item.appliesTo || ["channel", "group"]).join(", ")}
                  </td>
                  <td>{item.count}</td>
                  <td>
                    <button
                      className="admin-btn"
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => onDelete(item)}
                    >
                      {deletingId === item.id ? "…" : "O‘chirish"}
                    </button>
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
