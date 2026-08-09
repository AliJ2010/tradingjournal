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

export type DayStat = { count: number; pnl: number; wins: number; losses: number; rrs: string[] };

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
    <div className="grid grid-cols-7 gap-2">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div key={d} className="text-xs text-base-muted text-center pb-1">
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
            className={`aspect-square rounded-lg border ${border} ${bg} ${
              inMonth ? "" : "opacity-30"
            } ${isToday ? "ring-2 ring-accent" : ""} flex flex-col items-center justify-center gap-0.5 p-1`}
          >
            {stat && (
              <span className={`text-[11px] font-semibold leading-tight ${stat.pnl >= 0 ? "text-pill-green-bg" : "text-pill-red-bg"}`}>
                {stat.pnl < 0 ? "-" : ""}${Math.abs(stat.pnl).toFixed(0)}
              </span>
            )}
            {stat && stat.rrs.length > 0 && (
              <span className="text-[9px] text-base-muted leading-tight">{stat.rrs.join("/")}</span>
            )}
            <span className="text-xs text-base-muted">{format(day, "d")}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
