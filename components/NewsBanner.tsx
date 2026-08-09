"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type EconEvent = { id: string; time: string; title: string; impact: string; currency: string };

export default function NewsBanner({ date }: { date: string }) {
  const [events, setEvents] = useState<EconEvent[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    fetch(`/api/calendar?date=${date}`)
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [date]);

  const highImpact = (events || []).filter((e) => e.impact === "High");
  const mediumImpact = (events || []).filter((e) => e.impact === "Medium");

  if (loading) {
    return <p className="text-xs text-base-muted">Checking economic calendar...</p>;
  }

  if (!events || events.length === 0) {
    return <p className="text-xs text-base-muted">No cached USD news for this date. Hit "Refresh calendar" on the Journal page if this looks wrong.</p>;
  }

  if (highImpact.length === 0 && mediumImpact.length === 0) {
    return <p className="text-xs text-base-muted">No red/orange folder USD news today.</p>;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="space-y-1.5"
      >
        {highImpact.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-2 text-sm bg-pill-red-bg/15 border border-pill-red-bg/40 rounded-lg px-3 py-1.5"
          >
            <span className="text-pill-red-bg">🔴</span>
            <span className="font-medium">{e.title}</span>
            {e.time && <span className="text-base-muted text-xs ml-auto">{e.time}</span>}
          </div>
        ))}
        {mediumImpact.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-2 text-sm bg-pill-orange-bg/10 border border-pill-orange-bg/30 rounded-lg px-3 py-1.5"
          >
            <span className="text-pill-orange-bg">🟠</span>
            <span className="font-medium">{e.title}</span>
            {e.time && <span className="text-base-muted text-xs ml-auto">{e.time}</span>}
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
