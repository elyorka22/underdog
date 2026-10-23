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
      toast.show("Settings saved — helper applies on next tick");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <AdminShell title="Settings">
      <form className="admin-panel" onSubmit={onSave}>
        <p className="admin-muted">
          These settings are stored in PostgreSQL and read by the helper each
          tick. Secrets (Telegram session, tokens, DB password) stay in server
          env only and cannot be edited here.
        </p>

        <div className="admin-grid">
          <label className="admin-card">
            <div className="label">Auto-discovery</div>
            <input
              type="checkbox"
              checked={settings.autoDiscovery}
              onChange={(e) =>
                setSettings({ ...settings, autoDiscovery: e.target.checked })
              }
            />
          </label>
          <label className="admin-card">
            <div className="label">Batch size (1-50)</div>
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
            <div className="label">Interval ms</div>
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
            <div className="label">Delay ms</div>
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
            <div className="label">Discover every N ticks</div>
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
            <div className="label">Queries per tick</div>
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
            <div className="label">Max pending queue</div>
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
            <div className="label">Default language</div>
            <select
              className="admin-select"
              value={settings.defaultLanguage}
              onChange={(e) =>
                setSettings({ ...settings, defaultLanguage: e.target.value })
              }
            >
              <option value="uz">uz</option>
              <option value="ru">ru</option>
              <option value="en">en</option>
            </select>
          </label>
        </div>

        <div className="admin-row" style={{ marginTop: 14 }}>
          <button className="admin-btn primary" type="submit" disabled={!dirty}>
            Save settings
          </button>
          <button
            className="admin-btn"
            type="button"
            onClick={() => setSettings(DEFAULTS)}
          >
            Reset form to defaults
          </button>
          {dirty ? <span className="admin-warn">Unsaved changes</span> : null}
        </div>
      </form>
      {toast.node}
    </AdminShell>
  );
}
