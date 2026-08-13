"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import TradeForm, { emptyDraft, type TradeDraft } from "@/components/TradeForm";
import PillBadge from "@/components/PillBadge";
import ExportButtons from "@/components/ExportButtons";
import { toDayKey } from "@/lib/streak";
import { parseTags } from "@/lib/json";
import { formatMoney } from "@/lib/pnl";

type UnseenReaction = { id: string; dateKey: string; fromDisplayName: string; fromUsername: string };

function formatDateKeyShort(dateKey: string) {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

type TradeRow = {
  id: string;
  date: string;
  result: string;
  pnl: number;
};

function LikesBadge({ count, names }: { count: number; names: string[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <span
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((o) => !o);
      }}
      className="relative flex items-center gap-0.5 text-pill-pink-bg text-xs font-medium cursor-pointer"
    >
      <Heart size={12} fill="currentColor" />
      {count}
      {open && (
        <span
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-1 z-20 whitespace-nowrap bg-base-panel border border-base-border rounded-lg px-2.5 py-1.5 text-xs text-base-text shadow-lg"
        >
          Liked by {names.join(", ")}
        </span>
      )}
    </span>
  );
}

function tradeToDraft(t: any): TradeDraft {
  return {
    id: t.id,
    date: new Date(t.date).toISOString().slice(0, 10),
    result: t.result,
    direction: t.direction,
    htfBias: t.htfBias,
    instrument: t.instrument,
    timeFrame: t.timeFrame,
    entryTime: t.entryTime,
    exitTime: t.exitTime,
    riskPercent: t.riskPercent,
    rulesFollowed: t.rulesFollowed,
    rr: t.rr,
    pnl: t.pnl,
    drawDirectionTags: parseTags(t.drawDirectionTags),
    setupTags: parseTags(t.setupTags),
    emotionTags: parseTags(t.emotionTags),
    newsTags: parseTags(t.newsTags),
    whatOthersDid: t.whatOthersDid,
    notes: t.notes,
    whatWouldYouDo: t.whatWouldYouDo,
    chartImageUrl: t.chartImageUrl,
    hiddenFields: parseTags(t.hiddenFields),
  };
}

export default function JournalPage() {
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<TradeDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshStatus, setRefreshStatus] = useState("");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [reactionPopup, setReactionPopup] = useState<UnseenReaction[] | null>(null);
  const [likesByDay, setLikesByDay] = useState<Record<string, { count: number; names: string[] }>>({});

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
    fetch("/api/reactions")
      .then((r) => r.json())
      .then((data) => {
        if (data.byDay) setLikesByDay(data.byDay);
        if (data.unseen && data.unseen.length > 0) setReactionPopup(data.unseen);
        return fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "markSeen" }) });
      })
      .catch(() => {});
  }, [loadTrades]);

  useEffect(() => {
    if (!selectedId || selectedId === "new") return;
    fetch(`/api/trades/${selectedId}`)
      .then((r) => r.json())
      .then((t) => setDraft(tradeToDraft(t)));
  }, [selectedId]);

  function openNewEntry(date?: string) {
    setDraft(emptyDraft(date));
    setSelectedId("new");
    setMobileDetailOpen(true);
    setExpandedDay(null);
  }

  const groupedDays = useMemo(() => {
    const order: string[] = [];
    const map: Record<string, TradeRow[]> = {};
    for (const t of trades) {
      const key = toDayKey(t.date);
      if (!map[key]) {
        map[key] = [];
        order.push(key);
      }
      map[key].push(t);
    }
    return order.map((key) => ({ key, trades: map[key] }));
  }, [trades]);

  async function handleSave(d: TradeDraft) {
    const payload = { ...d };
    if (selectedId === "new" || !d.id) {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created.error || "Something went wrong.");
      await loadTrades();
      setSelectedId(created.id);
    } else {
      const res = await fetch(`/api/trades/${d.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }
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
      await fetch("/api/calendar", { method: "POST" });
      setRefreshStatus("Refreshed");
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
      <AnimatePresence>
        {reactionPopup && reactionPopup.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="fixed top-4 right-4 z-50 max-w-sm glass-panel border border-base-border rounded-2xl p-4 shadow-glow"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="text-sm font-semibold flex items-center gap-1.5">
                <Heart size={16} className="text-pill-red-bg" fill="currentColor" />
                {reactionPopup.length === 1 ? "New reaction" : "New reactions"}
              </div>
              <button onClick={() => setReactionPopup(null)} className="text-base-muted hover:text-base-text text-sm leading-none">
                ✕
              </button>
            </div>
            <div className="space-y-1.5">
              {reactionPopup.map((r) => (
                <div key={r.id} className="text-sm text-base-muted">
                  <span className="text-base-text font-medium">{r.fromDisplayName}</span> hearted your {formatDateKeyShort(r.dateKey)} entry
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={`${mobileDetailOpen ? "hidden" : "flex"} md:flex w-full md:w-72 shrink-0 border-r border-base-border flex-col md:h-screen`}>
        <div className="p-4 border-b border-base-border flex items-center justify-between gap-2">
          <button
            onClick={() => openNewEntry()}
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

        <div className="md:flex-1 md:overflow-y-auto px-2 pb-4 space-y-1">
          {groupedDays.length === 0 && <p className="px-3 text-sm text-base-muted">No entries yet. Log your first trade.</p>}
          {groupedDays.map(({ key, trades: dayTrades }) => {
            const single = dayTrades.length === 1 ? dayTrades[0] : null;
            const totalPnl = dayTrades.reduce((s, t) => s + t.pnl, 0);
            const isExpanded = expandedDay === key;
            const pnlColor = single
              ? single.result === "Win"
                ? "text-pill-green-bg"
                : single.result === "Loss"
                ? "text-pill-red-bg"
                : single.result === "Breakeven"
                ? "text-pill-gold-bg"
                : "text-base-muted"
              : totalPnl >= 0
              ? "text-pill-green-bg"
              : "text-pill-red-bg";

            return (
              <div key={key}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (single) {
                      setSelectedId(single.id);
                      setMobileDetailOpen(true);
                    } else {
                      setExpandedDay(isExpanded ? null : key);
                    }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.click()}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                    single && selectedId === single.id ? "bg-base-panel2" : "hover:bg-base-panel2/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {new Date(dayTrades[0].date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {likesByDay[key]?.count > 0 && <LikesBadge count={likesByDay[key].count} names={likesByDay[key].names} />}
                      {single ? (
                        <PillBadge small label={single.result} color={single.result === "Win" ? "green" : single.result === "Loss" ? "red" : single.result === "Breakeven" ? "gold" : "slate"} />
                      ) : (
                        <PillBadge small label={`${dayTrades.length} trades`} color="blue" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs ${pnlColor}`}>
                      {totalPnl < 0 ? "-" : ""}${formatMoney(totalPnl, 2)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedDay(isExpanded ? null : key);
                      }}
                      className="text-[11px] text-accent hover:underline"
                    >
                      Took another trade? +
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pl-3"
                    >
                      {dayTrades.length > 1 &&
                        dayTrades.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setSelectedId(t.id);
                              setMobileDetailOpen(true);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                              selectedId === t.id ? "bg-base-panel2" : "hover:bg-base-panel2/60"
                            }`}
                          >
                            <PillBadge
                              small
                              label={t.result}
                              color={t.result === "Win" ? "green" : t.result === "Loss" ? "red" : t.result === "Breakeven" ? "gold" : "slate"}
                            />
                            <span
                              className={
                                t.result === "Win"
                                  ? "text-pill-green-bg"
                                  : t.result === "Loss"
                                  ? "text-pill-red-bg"
                                  : t.result === "Breakeven"
                                  ? "text-pill-gold-bg"
                                  : "text-base-muted"
                              }
                            >
                              {t.pnl < 0 ? "-" : ""}${formatMoney(t.pnl, 2)}
                            </span>
                          </button>
                        ))}
                      <button
                        onClick={() => openNewEntry(key)}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-accent hover:bg-base-panel2/60"
                      >
                        + Add another trade for this day
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
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
