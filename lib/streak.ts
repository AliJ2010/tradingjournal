import { parseISO, differenceInCalendarDays } from "date-fns";

// Trade dates are stored as UTC midnight of the calendar day the user picked
// (see emptyDraft's default: new Date().toISOString().slice(0, 10)). Keying by
// UTC Y/M/D — rather than the viewer's local calendar day — keeps every trade
// under the date it was actually logged for, regardless of the viewer's
// timezone (a trade dated "Aug 11" stays "Aug 11" whether you're in Tokyo or
// New York, instead of shifting to the adjacent day for negative UTC offsets).
export function toDayKey(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function computeStreaks(loggedDates: (Date | string)[]) {
  const uniqueDays = Array.from(new Set(loggedDates.map(toDayKey))).sort();
  if (uniqueDays.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = differenceInCalendarDays(parseISO(uniqueDays[i]), parseISO(uniqueDays[i - 1]));
    if (diff === 1) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
  }

  const todayKey = toDayKey(new Date());
  const lastDay = uniqueDays[uniqueDays.length - 1];
  const gapFromToday = differenceInCalendarDays(parseISO(todayKey), parseISO(lastDay));

  let current = 0;
  if (gapFromToday <= 1) {
    current = 1;
    for (let i = uniqueDays.length - 1; i > 0; i--) {
      const diff = differenceInCalendarDays(parseISO(uniqueDays[i]), parseISO(uniqueDays[i - 1]));
      if (diff === 1) current += 1;
      else break;
    }
  }

  return { current, longest };
}
