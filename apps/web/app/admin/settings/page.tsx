"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminShell, useToast } from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-api";

type Settings = {
  autoDiscovery: boolean;
  batchSize: number;
  intervalMs: number;
  delayMs: number;
  concurrency: number;
  discoverEvery: number;
  queriesPerTick: number;
  maxPendingQueue: number;
  drainPendingThreshold: number;
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
  concurrency: 3,
  discoverEvery: 1,
  queriesPerTick: 2,
  maxPendingQueue: 5000,
  drainPendingThreshold: 150,
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
        setSettings({ ...DEFAULTS, ...data });
        setBaseline({ ...DEFAULTS, ...data });
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
      setSettings({ ...DEFAULTS, ...saved });
      setBaseline({ ...DEFAULTS, ...saved });
      toast.show("Saqlandi — helper keyingi siklda qo‘llaydi");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Saqlash xatosi");
    }
  }

  function applyFastQueue() {
    setSettings((prev) => ({
      ...prev,
      autoDiscovery: false,
      batchSize: 40,
      concurrency: 5,
      delayMs: 250,
      intervalMs: 8000,
      discoverEvery: 20,
      queriesPerTick: 1,
      drainPendingThreshold: 80,
    }));
  }

  return (
    <AdminShell title="Sozlamalar">
      <form className="admin-panel" onSubmit={onSave}>
        <p className="admin-muted">
          Navbat katta bo‘lsa: paketni oshiring, kechikishni kamaytiring,
          parallel sonini ko‘tarining yoki «Tez tozalash» presetini bosing.
          Helper har siklda DB dan o‘qiydi.
        </p>

        <div className="admin-row" style={{ marginBottom: 12 }}>
          <button
            className="admin-btn"
            type="button"
            onClick={() => applyFastQueue()}
          >
            Tez tozalash (preset)
          </button>
        </div>

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
            <div className="label">Paket hajmi (1–100)</div>
            <input
              className="admin-input"
              type="number"
              min={1}
              max={100}
              value={settings.batchSize}
              onChange={(e) =>
                setSettings({ ...settings, batchSize: Number(e.target.value) })
              }
            />
          </label>
          <label className="admin-card">
            <div className="label">Parallel (1–8)</div>
            <input
              className="admin-input"
              type="number"
              min={1}
              max={8}
              value={settings.concurrency}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  concurrency: Number(e.target.value),
                })
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
            <div className="label">Drain chegarasi (pending ≥)</div>
            <input
              className="admin-input"
              type="number"
              value={settings.drainPendingThreshold}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  drainPendingThreshold: Number(e.target.value),
                })
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
            onClick={() => setSettings(baseline)}
            disabled={!dirty}
          >
            Bekor qilish
          </button>
        </div>
      </form>
      {toast.node}
    </AdminShell>
  );
}
