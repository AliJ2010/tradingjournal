"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { addDays, format, parseISO, subDays } from "date-fns";

type EconEvent = { id: string; date: string; time: string; title: string; impact: string; currency: string };

export default function NewsPage() {
  const [events, setEvents] = useState<EconEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshStatus, setRefreshStatus] = useState("");

  async function load() {
    const from = format(subDays(new Date(), 3), "yyyy-MM-dd");
    const to = format(addDays(new Date(), 14), "yyyy-MM-dd");
    const res = await fetch(`/api/calendar?from=${from}&to=${to}`);
    const data = await res.json();
    setEvents(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function refresh() {
    setRefreshStatus("Refreshing from ForexFactory...");
    try {
      const res = await fetch("/api/calendar", { method: "POST" });
      const data = await res.json();
      setRefreshStatus(data.errors?.length ? `Refreshed with issues (${data.errors.length})` : `Refreshed — ${data.totalUpserted} events cached`);
      await load();
    } catch {
      setRefreshStatus("Refresh failed — check your connection");
    }
    setTimeout(() => setRefreshStatus(""), 4000);
  }

  const grouped = useMemo(() => {
    const map: Record<string, EconEvent[]> = {};
    for (const e of events) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold">News</h1>
        <button
          onClick={refresh}
          className="text-sm text-accent hover:underline"
        >
          Refresh
        </button>
      </div>
      <p className="text-sm text-base-muted mb-2">Red and orange folder USD news for this week and next, pulled from ForexFactory.</p>
      {refreshStatus && <p className="text-xs text-base-muted mb-6">{refreshStatus}</p>}
      {!refreshStatus && <div className="mb-6" />}

      {loading && <p className="text-sm text-base-muted">Loading news...</p>}

      {!loading && grouped.length === 0 && (
        <div className="glass-panel border border-base-border rounded-2xl p-6 text-sm text-base-muted">
          No cached news yet. Click "Refresh" to pull the latest calendar from ForexFactory.
        </div>
      )}

      <div className="space-y-5">
        {grouped.map(([date, dayEvents]) => (
          <motion.div key={date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-base-border rounded-2xl p-5">
            <div className="text-sm font-semibold mb-3">{format(parseISO(date), "EEEE, MMMM d")}</div>
            <div className="space-y-2">
              {dayEvents.map((e) => (
                <div
                  key={e.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 border-l-4 ${
                    e.impact === "High" ? "border-pill-red-bg bg-pill-red-bg/10" : "border-pill-orange-bg bg-pill-orange-bg/10"
                  }`}
                >
                  <span>{e.impact === "High" ? "🔴" : "🟠"}</span>
                  <span className="text-sm font-medium flex-1">{e.title}</span>
                  {e.time && <span className="text-xs text-base-muted">{e.time}</span>}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
