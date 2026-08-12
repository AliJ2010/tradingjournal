"use client";

import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { StatCard } from "@/components/StatCards";
import DownloadPnlCardButton from "@/components/DownloadPnlCardButton";
import { parseTags } from "@/lib/json";
import { formatMoney } from "@/lib/pnl";
import { useCountUp } from "@/lib/useCountUp";
import { exportDashboardPdf } from "@/lib/exportPdf";

type Trade = {
  id: string;
  date: string;
  result: string;
  direction: string;
  pnl: number;
  rulesFollowed: boolean;
  setupTags: string;
  instrument: string;
  timeFrame: string;
  entryTime: string;
  rr: string;
};

export default function DashboardPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  useEffect(() => {
    fetch("/api/trades")
      .then((r) => r.json())
      .then(setTrades)
      .finally(() => setLoading(false));
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => data.username && setUsername(data.username));
  }, []);

  const stats = useMemo(() => {
    const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const pureWins = trades.filter((t) => t.result === "Win").length;
    const breakevens = trades.filter((t) => t.result === "Breakeven").length;
    const wins = pureWins + breakevens;
    const losses = trades.filter((t) => t.result === "Loss").length;
    const total = trades.length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const avgPnl = total > 0 ? totalPnl / total : 0;
    const rulesFollowedRate = total > 0 ? (trades.filter((t) => t.rulesFollowed).length / total) * 100 : 0;

    let cumulative = 0;
    const equityCurve = sorted.map((t, i) => {
      cumulative += t.pnl;
      return { index: i + 1, equity: Number(cumulative.toFixed(2)), date: new Date(t.date).toLocaleDateString(undefined, { timeZone: "UTC" }) };
    });

    const setupCounts: Record<string, number> = {};
    for (const t of trades) {
      for (const tag of parseTags(t.setupTags)) {
        setupCounts[tag] = (setupCounts[tag] || 0) + 1;
      }
    }
    const setupBreakdown = Object.entries(setupCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    let winsSoFar = 0;
    const tradeLog = sorted
      .map((t, i) => {
        const winRateBefore = i > 0 ? (winsSoFar / i) * 100 : 0;
        if (t.result === "Win" || t.result === "Breakeven") winsSoFar += 1;
        const winRateAfter = (winsSoFar / (i + 1)) * 100;
        return { ...t, winRateEffect: winRateAfter - winRateBefore };
      })
      .reverse();

    return { wins, pureWins, breakevens, losses, total, winRate, totalPnl, avgPnl, rulesFollowedRate, equityCurve, setupBreakdown, tradeLog };
  }, [trades]);

  const winRateCount = useCountUp(stats.winRate);
  const pureWinsCount = useCountUp(stats.pureWins);
  const breakevensCount = useCountUp(stats.breakevens);
  const lossesCount = useCountUp(stats.losses);
  const totalPnlCount = useCountUp(stats.totalPnl);
  const avgPnlCount = useCountUp(stats.avgPnl);

  if (loading) return <div className="p-8 text-base-muted text-sm">Loading dashboard...</div>;

  const pieData = [
    { name: "Wins", value: stats.wins, color: "#3f8f6b" },
    { name: "Losses", value: stats.losses, color: "#c14f63" },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              exportDashboardPdf(trades, stats, `optictrader-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`)
            }
            className="flex items-center gap-1.5 text-sm text-base-muted hover:text-base-text border border-base-border rounded-lg px-3 py-1.5 transition-colors"
            title="Export dashboard as PDF"
          >
            ⬇ PDF
          </button>
          <DownloadPnlCardButton trades={trades} username={username} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Win rate" value={`${winRateCount.toFixed(1)}%`} tone="accent" />
        <div className="glass-panel border border-base-border rounded-2xl p-5">
          <div className="text-xs text-base-muted mb-1.5">Wins / BE / Losses</div>
          <div className="text-2xl font-semibold">
            <span className="text-pill-green-bg">{Math.round(pureWinsCount)}</span>
            <span className="text-base-muted"> / </span>
            <span className="text-pill-gold-bg">{Math.round(breakevensCount)}</span>
            <span className="text-base-muted"> / </span>
            <span className="text-pill-red-bg">{Math.round(lossesCount)}</span>
          </div>
        </div>
        <StatCard
          label="Total PnL"
          value={`${totalPnlCount >= 0 ? "+" : "-"}$${formatMoney(totalPnlCount, 2)}`}
          tone={totalPnlCount >= 0 ? "green" : "red"}
        />
        <StatCard
          label="Avg PnL / trade"
          value={`${avgPnlCount >= 0 ? "+" : "-"}$${formatMoney(avgPnlCount, 2)}`}
          tone={avgPnlCount >= 0 ? "green" : "red"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel border border-base-border rounded-2xl p-6">
          <h2 className="text-sm font-medium text-base-muted mb-4">Equity curve</h2>
          {stats.total === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-base-muted">Log a trade to see your equity curve.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stats.equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
                <XAxis dataKey="index" stroke="#8a8d93" fontSize={12} />
                <YAxis stroke="#8a8d93" fontSize={12} tickFormatter={(v) => `$${Number(v).toLocaleString()}`} />
                <Tooltip
                  contentStyle={{ background: "#1c1c1f", border: "1px solid #2a2a2e", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(v) => `Trade #${v}`}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "Equity"]}
                />
                <Line type="monotone" dataKey="equity" name="Equity" stroke="#6ee0c4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-panel border border-base-border rounded-2xl p-6">
          <h2 className="text-sm font-medium text-base-muted mb-4">Win / Loss</h2>
          {stats.total === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-base-muted">No trades yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1c1c1f", border: "1px solid #2a2a2e", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-center gap-4 text-xs text-base-muted mt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pill-green-bg inline-block" /> Wins
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pill-red-bg inline-block" /> Losses
            </span>
          </div>
          <div className="text-center mt-3 text-xs text-base-muted">Rules followed: {stats.rulesFollowedRate.toFixed(0)}%</div>
        </div>
      </div>

      {stats.setupBreakdown.length > 0 && (
        <div className="glass-panel border border-base-border rounded-2xl p-6 mt-6">
          <h2 className="text-sm font-medium text-base-muted mb-4">Most used setups</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.setupBreakdown} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" horizontal={false} />
              <XAxis type="number" stroke="#8a8d93" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke="#8a8d93" fontSize={12} width={130} />
              <Tooltip contentStyle={{ background: "#1c1c1f", border: "1px solid #2a2a2e", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#3d6fa8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.tradeLog.length > 0 && (
        <div className="glass-panel border border-base-border rounded-2xl p-6 mt-6">
          <h2 className="text-sm font-medium text-base-muted mb-4">Full trade log</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="text-xs text-base-muted text-left border-b border-base-border">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Direction</th>
                  <th className="pb-2 pr-4 font-medium">Symbol</th>
                  <th className="pb-2 pr-4 font-medium">Time frame</th>
                  <th className="pb-2 pr-4 font-medium">Time taken</th>
                  <th className="pb-2 pr-4 font-medium text-right">RR</th>
                  <th className="pb-2 pr-4 font-medium text-right">Profit</th>
                  <th className="pb-2 font-medium text-right">Win-rate effect</th>
                </tr>
              </thead>
              <tbody>
                {stats.tradeLog.map((t) => (
                  <tr key={t.id} className="border-b border-base-border/60 last:border-b-0">
                    <td className="py-2 pr-4 text-base-muted">{new Date(t.date).toLocaleDateString(undefined, { timeZone: "UTC" })}</td>
                    <td className="py-2 pr-4">{t.direction || "—"}</td>
                    <td className="py-2 pr-4">{t.instrument || "—"}</td>
                    <td className="py-2 pr-4 text-base-muted">{t.timeFrame || "—"}</td>
                    <td className="py-2 pr-4 text-base-muted">{t.entryTime || "—"}</td>
                    <td className="py-2 pr-4 text-right text-base-muted">{t.rr || "—"}</td>
                    <td className={`py-2 pr-4 text-right font-semibold ${t.pnl >= 0 ? "text-pill-green-bg" : "text-pill-red-bg"}`}>
                      {t.pnl < 0 ? "-" : "+"}${formatMoney(t.pnl, 2)}
                    </td>
                    <td className={`py-2 text-right ${t.winRateEffect > 0 ? "text-pill-green-bg" : t.winRateEffect < 0 ? "text-pill-red-bg" : "text-base-muted"}`}>
                      {t.winRateEffect > 0 ? "+" : ""}
                      {t.winRateEffect.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
