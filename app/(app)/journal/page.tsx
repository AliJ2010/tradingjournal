"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TradeForm, { emptyDraft, type TradeDraft } from "@/components/TradeForm";
import PillBadge from "@/components/PillBadge";
import ExportButtons from "@/components/ExportButtons";

type TradeRow = {
  id: string;
  date: string;
  result: string;
  pnl: number;
};

function tradeToDraft(t: any): TradeDraft {
  return {
    id: t.id,
    date: new Date(t.date).toISOString().slice(0, 10),
    result: t.result,
    direction: t.direction,
    htfBias: t.htfBias,
    entryTime: t.entryTime,
    exitTime: t.exitTime,
    riskPercent: t.riskPercent,
    rulesFollowed: t.rulesFollowed,
    rr: t.rr,
    pnl: t.pnl,
    drawDirectionTags: safeParse(t.drawDirectionTags),
    setupTags: safeParse(t.setupTags),
    emotionTags: safeParse(t.emotionTags),
    newsTags: safeParse(t.newsTags),
    whatOthersDid: t.whatOthersDid,
    notes: t.notes,
    whatWouldYouDo: t.whatWouldYouDo,
    chartImageUrl: t.chartImageUrl,
    hiddenFields: safeParse(t.hiddenFields),
  };
}

function safeParse(v: string) {
  try {
    return JSON.parse(v || "[]");
  } catch {
    return [];
  }
}

export default function JournalPage() {
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<TradeDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshStatus, setRefreshStatus] = useState("");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const loadTrades = useCallback(async () => {
    const res = await fetch("/api/trades");
    const data = await res.json();
    setTrades(data);
    return data;
  }, []);

  useEffect(() => {
    loadTrades().then((data) => {
      if (data.length > 0) {
        setSelectedId(data[0].id);
      } else {
        setSelectedId("new");
        setDraft(emptyDraft());
      }
      setLoading(false);
    });
  }, [loadTrades]);

  useEffect(() => {
    if (!selectedId) return;
    if (selectedId === "new") {
      setDraft(emptyDraft());
      return;
    }
    fetch(`/api/trades/${selectedId}`)
      .then((r) => r.json())
      .then((t) => setDraft(tradeToDraft(t)));
  }, [selectedId]);

  async function handleSave(d: TradeDraft) {
    const payload = { ...d };
    if (selectedId === "new" || !d.id) {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const created = await res.json();
      await loadTrades();
      setSelectedId(created.id);
    } else {
      await fetch(`/api/trades/${d.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await loadTrades();
    }
  }

  async function handleDelete() {
    if (!draft?.id) return;
    if (!confirm("Delete this journal entry? This can't be undone.")) return;
    await fetch(`/api/trades/${draft.id}`, { method: "DELETE" });
    const data = await loadTrades();
    setSelectedId(data.length > 0 ? data[0].id : "new");
  }

  async function refreshCalendar() {
    setRefreshStatus("Refreshing...");
    try {
      const res = await fetch("/api/calendar", { method: "POST" });
      const data = await res.json();
      setRefreshStatus(
        data.errors?.length ? `Refreshed with issues (${data.errors.length})` : `Refreshed — ${data.totalUpserted} events cached`
      );
    } catch {
      setRefreshStatus("Refresh failed — check your connection");
    }
    setTimeout(() => setRefreshStatus(""), 4000);
  }

  if (loading) {
    return <div className="p-8 text-base-muted text-sm">Loading journal...</div>;
  }

  return (
    <div className="flex flex-col md:flex-row md:h-screen">
      <div className={`${mobileDetailOpen ? "hidden" : "flex"} md:flex w-full md:w-72 shrink-0 border-r border-base-border flex-col md:h-screen`}>
        <div className="p-4 border-b border-base-border flex items-center justify-between gap-2">
          <button
            onClick={() => {
              setSelectedId("new");
              setMobileDetailOpen(true);
            }}
            className="flex-1 bg-brand-gradient text-white text-sm font-medium rounded-lg py-2 shadow-glow hover:brightness-110 transition-all"
          >
            + New entry
          </button>
        </div>
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-base-muted">Economic calendar</span>
          <button onClick={refreshCalendar} className="text-xs text-accent hover:underline">
            Refresh
          </button>
        </div>
        {refreshStatus && <div className="px-4 pb-2 text-xs text-base-muted">{refreshStatus}</div>}
        <div className="px-4 py-2 flex items-center justify-between border-t border-base-border">
          <span className="text-xs text-base-muted">Export journal</span>
          <ExportButtons />
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {trades.length === 0 && <p className="px-3 text-sm text-base-muted">No entries yet. Log your first trade.</p>}
          {trades.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedId(t.id);
                setMobileDetailOpen(true);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                selectedId === t.id ? "bg-base-panel2" : "hover:bg-base-panel2/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {new Date(t.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <PillBadge small label={t.result} color={t.result === "Win" ? "green" : t.result === "Loss" ? "red" : "slate"} />
              </div>
              <div className={`text-xs mt-0.5 ${t.pnl >= 0 ? "text-pill-green-bg" : "text-pill-red-bg"}`}>
                {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`${mobileDetailOpen ? "flex" : "hidden"} md:flex flex-1 overflow-y-auto flex-col`}>
        <button
          onClick={() => setMobileDetailOpen(false)}
          className="md:hidden text-sm text-accent px-6 pt-4 text-left"
        >
          ← Back to entries
        </button>
        <AnimatePresence mode="wait">
          {draft && (
            <TradeForm
              key={selectedId}
              initial={draft}
              onSave={handleSave}
              onDelete={selectedId !== "new" ? handleDelete : undefined}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
