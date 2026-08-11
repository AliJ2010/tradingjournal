"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { addMonths, subMonths, format, isSameMonth, parseISO } from "date-fns";
import CalendarGrid, { type DayStat } from "@/components/CalendarGrid";
import DownloadPnlCardButton from "@/components/DownloadPnlCardButton";
import { computeStreaks, toDayKey } from "@/lib/streak";
import { parseRRMagnitude, formatNumber } from "@/lib/rr";
import { formatMoney } from "@/lib/pnl";

type Trade = { id: string; date: string; result: string; direction: string; instrument: string; pnl: number; rr: string };

export default function CalendarPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [month, setMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    fetch("/api/trades")
      .then((r) => r.json())
      .then((data) => setTrades(data))
      .finally(() => setLoading(false));
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => data.username && setUsername(data.username));
  }, []);

  const statsByDay = useMemo(() => {
    const map: Record<string, DayStat> = {};
    for (const t of trades) {
      const key = toDayKey(t.date);
      if (!map[key]) map[key] = { count: 0, pnl: 0, wins: 0, losses: 0, rrSum: 0, hasRR: false, hasBreakeven: false };
      map[key].count += 1;
      map[key].pnl += t.pnl;
      const countsAsWin = t.result === "Win" || t.result === "Breakeven";
      if (countsAsWin) map[key].wins += 1;
      if (t.result === "Loss") map[key].losses += 1;
      if (t.result === "Breakeven") map[key].hasBreakeven = true;
      if (t.rr && t.rr.trim()) {
        const mag = parseRRMagnitude(t.rr);
        if (mag !== null) {
          map[key].rrSum += t.result === "Loss" ? -mag : countsAsWin ? mag : 0;
          map[key].hasRR = true;
        }
      }
    }
    return map;
  }, [trades]);

  const { current, longest } = useMemo(() => computeStreaks(trades.map((t) => t.date)), [trades]);

  const totalDaysLogged = Object.keys(statsByDay).length;

  const monthTotal = useMemo(() => {
    return Object.entries(statsByDay).reduce((sum, [key, stat]) => (isSameMonth(parseISO(key), month) ? sum + stat.pnl : sum), 0);
  }, [statsByDay, month]);

  const selectedDayStat = selectedDayKey ? statsByDay[selectedDayKey] : null;

  let tileBg = "bg-base-panel";
  let tileBorder = "border-base-border";
  let tilePnlText = "text-pill-green-bg";
  if (selectedDayStat) {
    if (selectedDayStat.pnl > 0) {
      tileBg = "bg-pill-green-bg/40";
      tileBorder = "border-pill-green-bg/70";
      tilePnlText = "text-pill-green-bg";
    } else if (selectedDayStat.pnl < 0) {
      tileBg = "bg-pill-red-bg/25";
      tileBorder = "border-pill-red-bg/50";
      tilePnlText = "text-pill-red-bg";
    } else if (selectedDayStat.hasBreakeven) {
      tileBg = "bg-pill-gold-bg/30";
      tileBorder = "border-pill-gold-bg/60";
      tilePnlText = "text-pill-gold-bg";
    } else {
      tileBg = "bg-pill-slate-bg/25";
      tileBorder = "border-pill-slate-bg/50";
      tilePnlText = "text-pill-green-bg";
    }
  }

  if (loading) return <div className="p-8 text-base-muted text-sm">Loading calendar...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">PnL Calendar</h1>
        <DownloadPnlCardButton trades={trades} username={username} />
      </div>

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
          <div className="text-center">
            <div className="font-medium">{format(month, "MMMM yyyy")}</div>
            <div className={`text-sm font-semibold mt-1.5 ${monthTotal >= 0 ? "text-pill-green-bg" : "text-pill-red-bg"}`}>
              Monthly PnL: {monthTotal < 0 ? "-" : ""}${formatMoney(monthTotal)}
            </div>
          </div>
          <button onClick={() => setMonth((m) => addMonths(m, 1))} className="text-base-muted hover:text-base-text px-2">
            →
          </button>
        </div>
        <CalendarGrid month={month} statsByDay={statsByDay} onSelectDay={setSelectedDayKey} expandedKey={selectedDayKey} />
      </div>

      {selectedDayKey && (
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="fixed inset-0 z-50 bg-base-bg/55 backdrop-blur-md overflow-y-auto flex flex-col"
        >
          <button
            onClick={() => setSelectedDayKey(null)}
            className="sticky top-0 z-10 bg-base-bg/95 backdrop-blur-sm border-b border-base-border w-full text-left px-6 py-4 text-sm text-accent hover:underline"
          >
            ← Back to calendar
          </button>

          <div className="flex-1 flex items-center justify-center px-6 py-8">
            <div className={`relative w-full max-w-sm aspect-square rounded-2xl border-2 ${tileBorder} ${tileBg} p-6`}>
              <span className="absolute top-5 right-6 text-4xl sm:text-5xl font-bold leading-none text-base-text">
                {format(parseISO(selectedDayKey), "d")}
              </span>
              {selectedDayStat && (
                <span className="absolute bottom-5 left-6 text-sm sm:text-base text-base-muted">
                  {selectedDayStat.count} {selectedDayStat.count === 1 ? "trade" : "trades"}
                </span>
              )}
              {selectedDayStat && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <span className={`text-5xl sm:text-6xl font-bold leading-tight ${tilePnlText}`}>
                    {selectedDayStat.pnl < 0 ? "-" : ""}${formatMoney(selectedDayStat.pnl)}
                  </span>
                  {selectedDayStat.hasRR && (
                    <span className="text-lg sm:text-xl text-base-muted leading-tight">{formatNumber(selectedDayStat.rrSum)} RR</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-sm text-base-muted pb-8 px-6">
            {format(parseISO(selectedDayKey), "EEEE, MMMM d, yyyy")}
          </div>
        </motion.div>
      )}
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
