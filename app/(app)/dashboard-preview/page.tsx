"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts";
import {
  Wallet,
  Percent,
  Target,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  LineChart as LineChartIcon,
  Layers,
  Boxes,
  ListOrdered,
} from "lucide-react";
import { parseTags } from "@/lib/json";
import { formatMoney } from "@/lib/pnl";
import { useCountUp } from "@/lib/useCountUp";
import { ChartTooltip } from "@/components/preview/ChartTooltip";

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

export default function DashboardPreviewPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trades")
      .then((r) => r.json())
      .then(setTrades)
      .finally(() => setLoading(false));
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
      return { index: i + 1, equity: Number(cumulative.toFixed(2)), date: new Date(t.date).toLocaleDateString() };
    });

    const setupCounts: Record<string, number> = {};
    for (const t of trades) {
      for (const tag of parseTags(t.setupTags)) {
        setupCounts[tag] = (setupCounts[tag] || 0) + 1;
      }
    }
    const setupBreakdown = Object.entries(setupCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    const instrumentMap: Record<string, { count: number; wins: number; pnl: number }> = {};
    for (const t of trades) {
      const inst = (t.instrument || "").trim();
      if (!inst) continue;
      if (!instrumentMap[inst]) instrumentMap[inst] = { count: 0, wins: 0, pnl: 0 };
      instrumentMap[inst].count += 1;
      if (t.result === "Win" || t.result === "Breakeven") instrumentMap[inst].wins += 1;
      instrumentMap[inst].pnl += t.pnl;
    }
    const instrumentBreakdown = Object.entries(instrumentMap)
      .map(([name, v]) => ({ name, count: v.count, winRate: v.count ? (v.wins / v.count) * 100 : 0, pnl: v.pnl }))
      .sort((a, b) => b.pnl - a.pnl);

    let winsSoFar = 0;
    const tradeLog = sorted
      .map((t, i) => {
        const winRateBefore = i > 0 ? (winsSoFar / i) * 100 : 0;
        if (t.result === "Win" || t.result === "Breakeven") winsSoFar += 1;
        const winRateAfter = (winsSoFar / (i + 1)) * 100;
        return { ...t, winRateEffect: winRateAfter - winRateBefore };
      })
      .reverse();

    return {
      wins,
      pureWins,
      breakevens,
      losses,
      total,
      winRate,
      totalPnl,
      avgPnl,
      rulesFollowedRate,
      equityCurve,
      setupBreakdown,
      instrumentBreakdown,
      tradeLog,
    };
  }, [trades]);

  if (loading) return <DashboardSkeleton />;

  if (stats.total === 0) return <EmptyDashboard />;

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <span className="text-xs text-base-muted">{stats.total} trades logged</span>
      </div>

      {/* Primary metrics: asymmetric — Total PnL leads, others follow */}
      <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr] gap-px bg-base-border border border-base-border rounded-lg overflow-hidden mb-6">
        <PrimaryMetric
          icon={Wallet}
          label="Total P&L"
          value={stats.totalPnl}
          isMoney
          tone={stats.totalPnl >= 0 ? "green" : "red"}
        />
        <PrimaryMetric icon={Percent} label="Win rate" value={stats.winRate} suffix="%" decimals={1} />
        <PrimaryMetric icon={Target} label="Avg / trade" value={stats.avgPnl} isMoney tone={stats.avgPnl >= 0 ? "green" : "red"} />
      </div>

      {/* Secondary row: performance breakdown + rules followed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 border border-base-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-base-muted">Performance breakdown</div>
            <div className="text-xs text-base-muted">
              {stats.total} trade{stats.total === 1 ? "" : "s"}
            </div>
          </div>
          <PerformanceBar wins={stats.pureWins} breakevens={stats.breakevens} losses={stats.losses} />
          <div className="flex items-center gap-5 mt-4 text-xs">
            <Legend color="#10b981" label="Win" count={stats.pureWins} />
            <Legend color="#eab308" label="Breakeven" count={stats.breakevens} />
            <Legend color="#ef4444" label="Loss" count={stats.losses} />
          </div>
        </div>

        <div className="border border-base-border rounded-lg p-5 flex flex-col">
          <div className="flex items-center gap-2 text-sm font-medium text-base-muted mb-3">
            <ShieldCheck className="w-4 h-4" />
            Rules followed
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <RulesGauge value={stats.rulesFollowedRate} />
          </div>
        </div>
      </div>

      {/* Equity curve */}
      <div className="border border-base-border rounded-lg p-5 mb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-base-muted mb-4">
          <LineChartIcon className="w-4 h-4" />
          Equity curve
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={stats.equityCurve} margin={{ left: 4, right: 4, top: 8 }}>
            <defs>
              <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5f5ef5" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#5f5ef5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#282b48" vertical={false} />
            <XAxis dataKey="index" stroke="#5c5f7e" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#5c5f7e"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
              width={56}
            />
            <Tooltip
              content={
                <ChartTooltip
                  labelFormatter={(l) => `Trade #${l}`}
                  valueFormatter={(v) => `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
              }
            />
            <Area type="monotone" dataKey="equity" name="Equity" stroke="#5f5ef5" strokeWidth={2} fill="url(#equityFill)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {stats.setupBreakdown.length > 0 && (
          <div className="border border-base-border rounded-lg p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-base-muted mb-4">
              <Layers className="w-4 h-4" />
              Most used setups
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.setupBreakdown} layout="vertical" margin={{ left: 8, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#282b48" horizontal={false} />
                <XAxis type="number" stroke="#5c5f7e" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#8a8dab" fontSize={12} width={110} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip valueFormatter={(v) => `${v} trades`} />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="count" fill="#5f5ef5" radius={[0, 3, 3, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {stats.instrumentBreakdown.length > 0 && (
          <div className="border border-base-border rounded-lg p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-base-muted mb-4">
              <Boxes className="w-4 h-4" />
              Instrument comparison
            </div>
            <div className="space-y-3">
              {stats.instrumentBreakdown.map((inst) => (
                <div key={inst.name} className="group">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{inst.name}</span>
                    <span className={`font-medium ${inst.pnl >= 0 ? "text-pill-green-bg" : "text-pill-red-bg"}`}>
                      {inst.pnl < 0 ? "-" : "+"}${formatMoney(inst.pnl, 2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-base-panel2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${inst.winRate >= 50 ? "bg-pill-green-bg" : "bg-pill-red-bg"}`}
                        style={{ width: `${Math.min(100, inst.winRate)}%` }}
                      />
                    </div>
                    <span className="text-xs text-base-muted w-24 text-right">
                      {inst.count} trade{inst.count === 1 ? "" : "s"} · {inst.winRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {stats.tradeLog.length > 0 && (
        <div className="border border-base-border rounded-lg p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-base-muted mb-4">
            <ListOrdered className="w-4 h-4" />
            Full trade log
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="text-xs text-base-muted text-left border-b border-base-border">
                  <th className="pb-2 px-2 font-medium">Date</th>
                  <th className="pb-2 px-2 font-medium">Direction</th>
                  <th className="pb-2 px-2 font-medium">Symbol</th>
                  <th className="pb-2 px-2 font-medium">TF</th>
                  <th className="pb-2 px-2 font-medium">Time</th>
                  <th className="pb-2 px-2 font-medium text-right">RR</th>
                  <th className="pb-2 px-2 font-medium text-right">Profit</th>
                  <th className="pb-2 px-2 font-medium text-right">Win-rate Δ</th>
                </tr>
              </thead>
              <tbody>
                {stats.tradeLog.map((t) => (
                  <tr key={t.id} className="border-b border-base-border/50 last:border-0 hover:bg-base-panel2/50 transition-colors">
                    <td className="py-2.5 px-2 text-base-muted">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="py-2.5 px-2">
                      <span className={`inline-flex items-center gap-1 ${t.direction === "Long" ? "text-pill-green-bg" : "text-pill-red-bg"}`}>
                        {t.direction === "Long" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {t.direction || "—"}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-medium">{t.instrument || "—"}</td>
                    <td className="py-2.5 px-2 text-base-muted">{t.timeFrame || "—"}</td>
                    <td className="py-2.5 px-2 text-base-muted">{t.entryTime || "—"}</td>
                    <td className="py-2.5 px-2 text-right text-base-muted">{t.rr || "—"}</td>
                    <td className={`py-2.5 px-2 text-right font-medium ${t.pnl >= 0 ? "text-pill-green-bg" : "text-pill-red-bg"}`}>
                      {t.pnl < 0 ? "-" : "+"}${formatMoney(t.pnl, 2)}
                    </td>
                    <td
                      className={`py-2.5 px-2 text-right ${
                        t.winRateEffect > 0 ? "text-pill-green-bg" : t.winRateEffect < 0 ? "text-pill-red-bg" : "text-base-muted"
                      }`}
                    >
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

function PrimaryMetric({
  icon: Icon,
  label,
  value,
  isMoney,
  suffix,
  decimals = 2,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: number;
  isMoney?: boolean;
  suffix?: string;
  decimals?: number;
  tone?: "green" | "red";
}) {
  const count = useCountUp(value);
  const toneClass = tone === "green" ? "text-pill-green-bg" : tone === "red" ? "text-pill-red-bg" : "text-base-text";
  const display = isMoney
    ? `${count < 0 ? "-" : "+"}$${Math.abs(count).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${count.toFixed(decimals)}${suffix ?? ""}`;
  return (
    <div className="bg-base-bg p-5">
      <div className="flex items-center gap-1.5 text-xs text-base-muted mb-2">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className={`text-2xl sm:text-3xl font-semibold tracking-tight ${toneClass}`}>{display}</div>
    </div>
  );
}

function PerformanceBar({ wins, breakevens, losses }: { wins: number; breakevens: number; losses: number }) {
  const total = wins + breakevens + losses;
  if (total === 0) return <div className="h-2.5 bg-base-panel2 rounded-full" />;
  const w = (wins / total) * 100;
  const b = (breakevens / total) * 100;
  const l = (losses / total) * 100;
  return (
    <div className="flex h-2.5 rounded-full overflow-hidden bg-base-panel2">
      {w > 0 && <div className="bg-pill-green-bg" style={{ width: `${w}%` }} />}
      {b > 0 && <div className="bg-pill-gold-bg" style={{ width: `${b}%` }} />}
      {l > 0 && <div className="bg-pill-red-bg" style={{ width: `${l}%` }} />}
    </div>
  );
}

function Legend({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <span className="flex items-center gap-1.5 text-base-muted">
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
      {label} <span className="text-base-text font-medium">{count}</span>
    </span>
  );
}

function RulesGauge({ value }: { value: number }) {
  const count = useCountUp(value);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, count) / 100) * circumference;
  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1c1e33" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={value >= 70 ? "#10b981" : value >= 40 ? "#eab308" : "#ef4444"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold">{count.toFixed(0)}%</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto animate-pulse">
      <div className="h-6 w-28 bg-base-panel2 rounded mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-base-border border border-base-border rounded-lg overflow-hidden mb-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-base-bg p-5 space-y-3">
            <div className="h-3 w-20 bg-base-panel2 rounded" />
            <div className="h-8 w-28 bg-base-panel2 rounded" />
          </div>
        ))}
      </div>
      <div className="h-64 border border-base-border rounded-lg mb-6 bg-base-panel2/30" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-48 border border-base-border rounded-lg bg-base-panel2/30" />
        <div className="h-48 border border-base-border rounded-lg bg-base-panel2/30" />
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold tracking-tight mb-8">Dashboard</h1>
      <div className="border border-dashed border-base-border rounded-lg py-20 flex flex-col items-center text-center px-6">
        <div className="w-12 h-12 rounded-full border border-base-border flex items-center justify-center mb-4">
          <TrendingUp className="w-5 h-5 text-base-muted" />
        </div>
        <div className="font-medium mb-1">No trades logged yet</div>
        <p className="text-sm text-base-muted max-w-xs">
          Log your first trade in the journal and your win rate, equity curve, and setup breakdown will show up here.
        </p>
      </div>
    </div>
  );
}
