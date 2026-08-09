"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type Settings = {
  displayName: string;
  timezone: string;
  instrument: string;
  hasApiKey: boolean;
  apiKeyPreview: string | null;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [instrument, setInstrument] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const timezones = useMemo(() => {
    try {
      // @ts-ignore - available in modern Node/browser runtimes
      return Intl.supportedValuesOf("timeZone") as string[];
    } catch {
      return ["UTC", "America/New_York", "America/Chicago", "Europe/London", "Europe/Berlin", "Asia/Tokyo"];
    }
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Settings) => {
        setSettings(data);
        setDisplayName(data.displayName);
        setTimezone(data.timezone);
        setInstrument(data.instrument);
      });
  }, []);

  async function save(extra: Record<string, any> = {}) {
    setSaving(true);
    setStatus("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, timezone, instrument, ...extra }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setSettings(data);
      setApiKey("");
      setStatus("Saved.");
      setTimeout(() => setStatus(""), 2500);
    } else {
      setStatus(data.error || "Something went wrong.");
    }
  }

  if (!settings) return <div className="p-8 text-base-muted text-sm">Loading settings...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Settings</h1>
      <p className="text-sm text-base-muted mb-8">Personalize your journal.</p>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-base-border rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-xs text-base-muted mb-1.5 field-label">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-base-panel2 border border-base-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:shadow-glow outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs text-base-muted mb-1.5 field-label">Instrument you trade</label>
          <input
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            placeholder="e.g. NQ, ES, EURUSD"
            className="w-full bg-base-panel2 border border-base-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:shadow-glow outline-none transition-all"
          />
          <p className="text-xs text-base-muted mt-1.5">Used by the AI Coach and to filter relevant news.</p>
        </div>

        <div>
          <label className="block text-xs text-base-muted mb-1.5 field-label">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full bg-base-panel2 border border-base-border rounded-lg px-3 py-2.5 text-sm focus:border-accent outline-none transition-all"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <p className="text-xs text-base-muted mt-1.5">Used to label Entry/Exit times and the news calendar.</p>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => save()}
          disabled={saving}
          className="bg-brand-gradient text-white font-medium rounded-lg px-4 py-2.5 text-sm shadow-glow hover:brightness-110 transition-all disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel border border-base-border rounded-2xl p-6 mt-6 space-y-4"
      >
        <div>
          <h2 className="text-sm font-semibold mb-1">AI Coach — Anthropic API key</h2>
          <p className="text-xs text-base-muted">
            {settings.hasApiKey ? `Current key: ${settings.apiKeyPreview}` : "No key set — the coach will fall back to the server's key if one is configured."}
          </p>
        </div>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          className="w-full bg-base-panel2 border border-base-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:shadow-glow outline-none transition-all"
        />
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => apiKey && save({ anthropicApiKey: apiKey })}
            disabled={saving || !apiKey}
            className="bg-brand-gradient text-white font-medium rounded-lg px-4 py-2.5 text-sm shadow-glow hover:brightness-110 transition-all disabled:opacity-50"
          >
            Save key
          </motion.button>
          {settings.hasApiKey && (
            <button
              onClick={() => save({ clearApiKey: true })}
              className="text-sm text-pill-red-bg hover:underline px-3 py-2.5"
            >
              Remove key
            </button>
          )}
        </div>
      </motion.div>

      {status && <p className="text-sm text-accent mt-4">{status}</p>}
    </div>
  );
}
