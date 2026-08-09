"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";
import { formatNumber } from "@/lib/rr";

export type DayStat = {
  count: number;
  pnl: number;
  wins: number;
  losses: number;
  rrSum: number;
  hasRR: boolean;
  hasBreakeven: boolean;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarGrid({
  month,
  statsByDay,
  onSelectDay,
}: {
  month: Date;
  statsByDay: Record<string, DayStat>;
  onSelectDay?: (dayKey: string) => void;
}) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  const today = new Date();

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_auto] gap-2">
      {WEEKDAY_LABELS.map((d) => (
        <div key={d} className="text-sm text-base-muted text-center pb-1">
          {d}
        </div>
      ))}
      <div className="text-sm text-base-muted text-center pb-1 px-1">Weekly PnL</div>

      {weeks.map((week, weekIdx) => {
        const weekTotal = week.reduce((sum, day) => sum + (statsByDay[format(day, "yyyy-MM-dd")]?.pnl || 0), 0);
        return (
          <Fragment key={weekIdx}>
            {week.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const stat = statsByDay[key];
              const inMonth = isSameMonth(day, month);
              const isToday = isSameDay(day, today);

              let bg = "bg-base-panel";
              let border = "border-base-border";
              let pnlText = "text-pill-green-bg";
              if (stat) {
                if (stat.pnl > 0) {
                  bg = "bg-pill-green-bg/40";
                  border = "border-pill-green-bg/70";
                  pnlText = "text-pill-green-bg";
                } else if (stat.pnl < 0) {
                  bg = "bg-pill-red-bg/25";
                  border = "border-pill-red-bg/50";
                  pnlText = "text-pill-red-bg";
                } else if (stat.hasBreakeven) {
                  bg = "bg-pill-gold-bg/30";
                  border = "border-pill-gold-bg/60";
                  pnlText = "text-pill-gold-bg";
                } else {
                  bg = "bg-pill-slate-bg/25";
                  border = "border-pill-slate-bg/50";
                  pnlText = "text-pill-green-bg";
                }
              }

              return (
                <motion.button
                  key={key}
                  onClick={() => stat && onSelectDay?.(key)}
                  whileHover={stat ? { scale: 1.04 } : {}}
                  className={`relative aspect-square rounded-lg border ${border} ${bg} ${
                    inMonth ? "" : "opacity-30"
                  } ${isToday ? "ring-2 ring-accent" : ""} p-1`}
                >
                  <span className="absolute top-1 right-1.5 text-base sm:text-xl font-bold leading-none text-base-text">
                    {format(day, "d")}
                  </span>
                  {stat && (
                    <span className="absolute bottom-1 left-1.5 text-[9px] sm:text-xs text-base-muted leading-tight">
                      {stat.count} {stat.count === 1 ? "trade" : "trades"}
                    </span>
                  )}
                  {stat && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pointer-events-none">
                      <span className={`text-sm sm:text-lg font-bold leading-tight ${pnlText}`}>
                        {stat.pnl < 0 ? "-" : ""}${Math.abs(stat.pnl).toFixed(0)}
                      </span>
                      {stat.hasRR && (
                        <span className="text-[9px] sm:text-xs text-base-muted leading-tight">{formatNumber(stat.rrSum)} RR</span>
                      )}
                    </div>
                  )}
                </motion.button>
              );
            })}
            <div
              key={`total-${weekIdx}`}
              className={`flex flex-col items-center justify-center rounded-lg border border-base-border bg-base-panel2/50 px-2 ${
                weekTotal === 0 ? "opacity-50" : ""
              }`}
            >
              <span
                className={`text-xs sm:text-sm font-bold leading-tight ${
                  weekTotal >= 0 ? "text-pill-green-bg" : "text-pill-red-bg"
                }`}
              >
                {weekTotal < 0 ? "-" : ""}${Math.abs(weekTotal).toFixed(0)}
              </span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
