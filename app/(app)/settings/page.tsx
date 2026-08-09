"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { COUNTRY_TIMEZONES, utcOffsetLabel } from "@/lib/countryTimezones";
import InstallPwaHint from "@/components/InstallPwaHint";

type Billing = {
  plan: string;
  isTrialActive: boolean;
  isExpired: boolean;
  daysLeft: number | null;
};

type Settings = {
  displayName: string;
  timezone: string;
  instrument: string;
  billing: Billing;
};

const PLAN_LABELS: Record<string, string> = {
  trial: "Free trial",
  monthly: "Monthly plan",
  lifetime: "Lifetime plan",
  expired: "No active plan",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [instrument, setInstrument] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [billingStatus, setBillingStatus] = useState("");
  const [billingBusy, setBillingBusy] = useState(false);

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

  async function cancelSubscription() {
    if (!confirm("End your subscription? You'll lose paid access immediately.")) return;
    setBillingBusy(true);
    setBillingStatus("");
    const res = await fetch("/api/account/cancel-subscription", { method: "POST" });
    const data = await res.json();
    setBillingBusy(false);
    if (res.ok) {
      setSettings((s) => (s ? { ...s, billing: data.billing } : s));
      setBillingStatus("Subscription ended.");
    } else {
      setBillingStatus(data.error || "Something went wrong.");
    }
  }

  async function deleteAccount() {
    if (!confirm("Delete your account? This permanently removes your journal, trades, and settings. This can't be undone.")) return;
    if (!confirm("Are you absolutely sure? Type-checking done — this is your final confirmation.")) return;
    setBillingBusy(true);
    setBillingStatus("");
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/login";
    } else {
      setBillingBusy(false);
      const data = await res.json().catch(() => ({}));
      setBillingStatus(data.error || "Something went wrong.");
    }
  }

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

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-base-border rounded-2xl mt-6 overflow-hidden">
        <button
          onClick={() => setBillingOpen((o) => !o)}
          className="w-full flex items-center justify-between px-6 py-4 text-left"
        >
          <div>
            <div className="text-sm font-medium">Billing &amp; account</div>
            <div className="text-xs text-base-muted mt-0.5">
              {PLAN_LABELS[settings.billing.plan] || settings.billing.plan}
              {settings.billing.isTrialActive && settings.billing.daysLeft !== null && ` — ${settings.billing.daysLeft} day(s) left`}
              {settings.billing.isExpired && " — expired"}
            </div>
          </div>
          <span className="text-base-muted">{billingOpen ? "▲" : "▼"}</span>
        </button>

        {billingOpen && (
          <div className="px-6 pb-6 space-y-4 border-t border-base-border pt-4">
            <div className="text-sm text-base-muted">
              Billing is not live yet — plans are managed manually for now.{" "}
              <a href="/pricing" className="text-accent hover:underline">
                See pricing
              </a>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={cancelSubscription}
                disabled={billingBusy}
                className="text-sm bg-base-panel2 border border-base-border rounded-lg px-4 py-2 hover:border-pill-orange-bg/60 hover:text-pill-orange-bg transition-colors disabled:opacity-60"
              >
                End subscription
              </button>
              <button
                onClick={deleteAccount}
                disabled={billingBusy}
                className="text-sm bg-base-panel2 border border-base-border rounded-lg px-4 py-2 hover:border-pill-red-bg/60 hover:text-pill-red-bg transition-colors disabled:opacity-60"
              >
                Delete account
              </button>
            </div>

            {billingStatus && <p className="text-xs text-base-muted">{billingStatus}</p>}
          </div>
        )}
      </motion.div>

      <div className="mt-8 text-center">
        <InstallPwaHint />
      </div>
    </div>
  );
}
