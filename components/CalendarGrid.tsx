"use client";

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

export type DayStat = { count: number; pnl: number; wins: number; losses: number; rrSum: number; hasRR: boolean };

export default function CalendarGrid({
  month,
  statsByDay,
  onSelectDay,
}: {
  month: Date;
  statsByDay: Record<string, DayStat>;
  onSelectDay?: (dayKey: string) => void;
}) {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start, end });
  const today = new Date();

  return (
    <div className="grid grid-cols-7 gap-3">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div key={d} className="text-sm text-base-muted text-center pb-1.5">
          {d}
        </div>
      ))}
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const stat = statsByDay[key];
        const inMonth = isSameMonth(day, month);
        const isToday = isSameDay(day, today);

        let bg = "bg-base-panel";
        let border = "border-base-border";
        if (stat) {
          if (stat.pnl > 0) {
            bg = "bg-pill-green-bg/40";
            border = "border-pill-green-bg/70";
          } else if (stat.pnl < 0) {
            bg = "bg-pill-red-bg/25";
            border = "border-pill-red-bg/50";
          } else {
            bg = "bg-pill-slate-bg/25";
            border = "border-pill-slate-bg/50";
          }
        }

        return (
          <motion.button
            key={key}
            onClick={() => stat && onSelectDay?.(key)}
            whileHover={stat ? { scale: 1.04 } : {}}
            className={`relative aspect-square rounded-xl border ${border} ${bg} ${
              inMonth ? "" : "opacity-30"
            } ${isToday ? "ring-2 ring-accent" : ""} p-1.5`}
          >
            <span className="absolute top-1.5 right-2 text-base sm:text-2xl font-bold leading-none text-base-text">
              {format(day, "d")}
            </span>
            {stat && (
              <span className="absolute bottom-1.5 left-2 text-[10px] sm:text-sm text-base-muted leading-tight">
                {stat.count} {stat.count === 1 ? "trade" : "trades"}
              </span>
            )}
            {stat && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
                <span
                  className={`text-sm sm:text-xl font-bold leading-tight ${
                    stat.pnl >= 0 ? "text-pill-green-bg" : "text-pill-red-bg"
                  }`}
                >
                  {stat.pnl < 0 ? "-" : ""}${Math.abs(stat.pnl).toFixed(0)}
                </span>
                {stat.hasRR && (
                  <span className="text-[10px] sm:text-sm text-base-muted leading-tight">{formatNumber(stat.rrSum)} RR</span>
                )}
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
