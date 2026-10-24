"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminShell, useToast } from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-api";

type Settings = {
  autoDiscovery: boolean;
  batchSize: number;
  intervalMs: number;
  delayMs: number;
  discoverEvery: number;
  queriesPerTick: number;
  maxPendingQueue: number;
  defaultLanguage: string;
  defaultCategoryId: string;
  duplicateHandling: string;
  moderationRequired: boolean;
};

const DEFAULTS: Settings = {
  autoDiscovery: true,
  batchSize: 8,
  intervalMs: 60000,
  delayMs: 2000,
  discoverEvery: 1,
  queriesPerTick: 2,
  maxPendingQueue: 5000,
  defaultLanguage: "uz",
  defaultCategoryId: "tech",
  duplicateHandling: "skip",
  moderationRequired: false,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [baseline, setBaseline] = useState<Settings>(DEFAULTS);
  const toast = useToast();
  const dirty = JSON.stringify(settings) !== JSON.stringify(baseline);

  useEffect(() => {
    adminFetch<Settings>("/api/admin/settings")
      .then((data) => {
        setSettings(data);
        setBaseline(data);
      })
      .catch((err) => toast.show(err.message));
  }, []);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    try {
      const saved = await adminFetch<Settings>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSettings(saved);
      setBaseline(saved);
      toast.show("Saqlandi — helper keyingi siklda qo‘llaydi");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Saqlash xatosi");
    }
  }

  return (
    <AdminShell title="Sozlamalar">
      <form className="admin-panel" onSubmit={onSave}>
        <p className="admin-muted">
          Bu sozlamalar PostgreSQL da saqlanadi va helper har bir siklda
          o‘qiydi. Maxfiy kalitlar (Telegram session, token, DB parol) faqat
          server muhitida qoladi va bu yerda ko‘rinmaydi.
        </p>

        <div className="admin-grid">
          <label className="admin-card">
            <div className="label">Avto-qidiruv</div>
            <input
              type="checkbox"
              checked={settings.autoDiscovery}
              onChange={(e) =>
                setSettings({ ...settings, autoDiscovery: e.target.checked })
              }
            />
          </label>
          <label className="admin-card">
            <div className="label">Paket hajmi (1–50)</div>
            <input
              className="admin-input"
              type="number"
              value={settings.batchSize}
              onChange={(e) =>
                setSettings({ ...settings, batchSize: Number(e.target.value) })
              }
            />
          </label>
          <label className="admin-card">
            <div className="label">Interval (ms)</div>
            <input
              className="admin-input"
              type="number"
              value={settings.intervalMs}
              onChange={(e) =>
                setSettings({ ...settings, intervalMs: Number(e.target.value) })
              }
            />
          </label>
          <label className="admin-card">
            <div className="label">Kechikish (ms)</div>
            <input
              className="admin-input"
              type="number"
              value={settings.delayMs}
              onChange={(e) =>
                setSettings({ ...settings, delayMs: Number(e.target.value) })
              }
            />
          </label>
          <label className="admin-card">
            <div className="label">Har N siklda qidiruv</div>
            <input
              className="admin-input"
              type="number"
              value={settings.discoverEvery}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  discoverEvery: Number(e.target.value),
                })
              }
            />
          </label>
          <label className="admin-card">
            <div className="label">Sikl uchun so‘rovlar</div>
            <input
              className="admin-input"
              type="number"
              value={settings.queriesPerTick}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  queriesPerTick: Number(e.target.value),
                })
              }
            />
          </label>
          <label className="admin-card">
            <div className="label">Maks. kutayotgan navbat</div>
            <input
              className="admin-input"
              type="number"
              value={settings.maxPendingQueue}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxPendingQueue: Number(e.target.value),
                })
              }
            />
          </label>
          <label className="admin-card">
            <div className="label">Standart til</div>
            <select
              className="admin-select"
              value={settings.defaultLanguage}
              onChange={(e) =>
                setSettings({ ...settings, defaultLanguage: e.target.value })
              }
            >
              <option value="uz">O‘zbek</option>
              <option value="ru">Rus</option>
              <option value="en">Ingliz</option>
            </select>
          </label>
        </div>

        <div className="admin-row" style={{ marginTop: 14 }}>
          <button className="admin-btn primary" type="submit" disabled={!dirty}>
            Saqlash
          </button>
          <button
            className="admin-btn"
            type="button"
            onClick={() => setSettings(DEFAULTS)}
          >
            Standartga qaytarish
          </button>
          {dirty ? (
            <span className="admin-warn">Saqlanmagan o‘zgarishlar bor</span>
          ) : null}
        </div>
      </form>
      {toast.node}
    </AdminShell>
  );
}
