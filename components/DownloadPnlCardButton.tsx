"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X } from "lucide-react";
import PnlCard from "./PnlCard";
import { toDayKey } from "@/lib/streak";
import { effectiveRR } from "@/lib/rr";

type Trade = { date: string; pnl: number; result: string; rr: string };

export default function DownloadPnlCardButton({ trades, username }: { trades: Trade[]; username: string }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => {
    const key = toDayKey(new Date());
    const dayTrades = trades.filter((t) => toDayKey(t.date) === key);
    const pnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
    const wins = dayTrades.filter((t) => t.result === "Win" || t.result === "Breakeven").length;
    const winRate = dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0;
    const rrValues = dayTrades.map((t) => effectiveRR(t.rr, t.result)).filter((v): v is number => v !== null);
    const rrLabel = rrValues.length === 0 ? "—" : (rrValues.reduce((a, b) => a + b, 0) / rrValues.length).toFixed(1);
    const dateLabel = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    return { pnl, trades: dayTrades.length, winRate, rrLabel, dateLabel };
  }, [trades]);

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    setError("");
    try {
      const { toPng } = await import("html-to-image");
      const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 20000));
      const dataUrl = await Promise.race([toPng(cardRef.current, { pixelRatio: 2 }), timeout]);
      const link = document.createElement("a");
      link.download = `optictrader-pnl-${toDayKey(new Date())}.png`;
      link.href = dataUrl;
      link.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } catch (err) {
      console.error("PnL card export failed", err);
      setError("Couldn't generate the image — try again.");
    } finally {
      setDownloading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setError("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-base-muted hover:text-base-text border border-base-border rounded-lg px-3 py-1.5 transition-colors"
        title="Download PnL Card"
      >
        <Download size={15} />
        <span className="hidden sm:inline">PnL Card</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-base-bg/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
              className="relative"
            >
              <button
                onClick={handleClose}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-base-panel2 border border-base-border flex items-center justify-center text-base-muted hover:text-base-text"
              >
                <X size={16} />
              </button>

              <PnlCard
                ref={cardRef}
                dateLabel={today.dateLabel}
                pnl={today.pnl}
                trades={today.trades}
                rrLabel={today.rrLabel}
                winRate={today.winRate}
                username={username}
              />

              <div className="text-center mt-5">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="bg-brand-gradient text-white font-semibold rounded-lg px-6 py-2.5 text-sm shadow-glow hover:brightness-110 transition-all disabled:opacity-60"
                >
                  {downloading ? "Generating..." : downloaded ? "Downloaded!" : "Download card"}
                </button>
                {error && <div className="text-xs text-pill-red-bg mt-2">{error}</div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
