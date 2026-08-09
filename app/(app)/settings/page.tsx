"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { COUNTRY_TIMEZONES, utcOffsetLabel } from "@/lib/countryTimezones";
import InstallPwaHint from "@/components/InstallPwaHint";

type Settings = {
  displayName: string;
  timezone: string;
  instrument: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [instrument, setInstrument] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

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
      setStatus("Saved.");
      setTimeout(() => setStatus(""), 2500);
    } else {
      setStatus(data.error || "Something went wrong.");
    }
  }

  if (!settings) return <div className="p-8 text-base-muted text-sm">Loading settings...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
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
            {!COUNTRY_TIMEZONES.some((c) => c.zone === timezone) && (
              <option value={timezone}>{timezone} ({utcOffsetLabel(timezone)})</option>
            )}
            {COUNTRY_TIMEZONES.map((c) => (
              <option key={c.zone} value={c.zone}>
                {c.label} — {utcOffsetLabel(c.zone)}
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

      {status && <p className="text-sm text-accent mt-4">{status}</p>}

      <div className="mt-8 text-center">
        <InstallPwaHint />
      </div>
    </div>
  );
}
