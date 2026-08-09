"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { addMonths, subMonths, format } from "date-fns";
import CalendarGrid, { type DayStat } from "@/components/CalendarGrid";
import { computeStreaks, toDayKey } from "@/lib/streak";
import { parseRRMagnitude } from "@/lib/rr";

type Trade = { id: string; date: string; result: string; pnl: number; rr: string };

export default function CalendarPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [month, setMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trades")
      .then((r) => r.json())
      .then((data) => setTrades(data))
      .finally(() => setLoading(false));
  }, []);

  const statsByDay = useMemo(() => {
    const map: Record<string, DayStat> = {};
    for (const t of trades) {
      const key = toDayKey(t.date);
      if (!map[key]) map[key] = { count: 0, pnl: 0, wins: 0, losses: 0, rrSum: 0, hasRR: false };
      map[key].count += 1;
      map[key].pnl += t.pnl;
      if (t.result === "Win") map[key].wins += 1;
      if (t.result === "Loss") map[key].losses += 1;
      if (t.rr && t.rr.trim()) {
        const mag = parseRRMagnitude(t.rr);
        if (mag !== null) {
          map[key].rrSum += t.result === "Loss" ? -mag : t.result === "Win" ? mag : 0;
          map[key].hasRR = true;
        }
      }
    }
    return map;
  }, [trades]);

  const { current, longest } = useMemo(() => computeStreaks(trades.map((t) => t.date)), [trades]);

  const totalDaysLogged = Object.keys(statsByDay).length;

  if (loading) return <div className="p-8 text-base-muted text-sm">Loading calendar...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Calendar</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StreakCard label="Current streak" value={current} suffix="days" highlight />
        <StreakCard label="Longest streak" value={longest} suffix="days" />
        <StreakCard label="Days logged" value={totalDaysLogged} suffix="total" />
      </div>

      <div className="glass-panel border border-base-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setMonth((m) => subMonths(m, 1))} className="text-base-muted hover:text-base-text px-2">
            ←
          </button>
          <span className="font-medium">{format(month, "MMMM yyyy")}</span>
          <button onClick={() => setMonth((m) => addMonths(m, 1))} className="text-base-muted hover:text-base-text px-2">
            →
          </button>
        </div>
        <CalendarGrid month={month} statsByDay={statsByDay} />
      </div>
    </div>
  );
}

function StreakCard({ label, value, suffix, highlight }: { label: string; value: number; suffix: string; highlight?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 border ${
        highlight ? "bg-brand-gradient-soft border-accent/40 shadow-glow" : "glass-panel border-base-border"
      }`}
    >
      <div className="text-xs text-base-muted mb-1">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <motion.span
          key={value}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-3xl font-semibold ${highlight ? "text-accent" : ""}`}
        >
          {value}
        </motion.span>
        {highlight && value > 0 && <span className="text-lg">🔥</span>}
        <span className="text-sm text-base-muted">{suffix}</span>
      </div>
    </motion.div>
  );
}
