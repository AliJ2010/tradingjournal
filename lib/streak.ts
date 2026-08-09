import { formatISO, parseISO, differenceInCalendarDays, startOfDay } from "date-fns";

export function toDayKey(date: Date | string) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatISO(startOfDay(d), { representation: "date" });
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
