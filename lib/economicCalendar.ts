import { prisma } from "./db";
import { formatISO } from "date-fns";

const FEED_URLS = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://nfs.faireconomy.media/ff_calendar_nextweek.json",
];

type FFEvent = {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast?: string;
  previous?: string;
};

export async function refreshEconomicCalendar() {
  let totalUpserted = 0;
  const errors: string[] = [];

  for (const url of FEED_URLS) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        errors.push(`${url} -> HTTP ${res.status}`);
        continue;
      }
      const events: FFEvent[] = await res.json();
      for (const ev of events) {
        if (!ev.country || !ev.date) continue;
        const parsed = new Date(ev.date);
        if (isNaN(parsed.getTime())) continue;

        const dateKey = formatISO(parsed, { representation: "date" });
        const timeKey = formatISO(parsed, { representation: "time" }).slice(0, 5);

        await prisma.economicEvent.upsert({
          where: {
            date_time_currency_title: {
              date: dateKey,
              time: timeKey,
              currency: ev.country,
              title: ev.title,
            },
          },
          create: {
            date: dateKey,
            time: timeKey,
            currency: ev.country,
            impact: ev.impact || "Low",
            title: ev.title,
          },
          update: {
            impact: ev.impact || "Low",
          },
        });
        totalUpserted++;
      }
    } catch (err: any) {
      errors.push(`${url} -> ${err.message || "fetch failed"}`);
    }
  }

  return { totalUpserted, errors };
}

// US index/equity futures trade off USD macro data, so we only care about USD-denominated events.
export async function getEventsForDate(dateKey: string) {
  return prisma.economicEvent.findMany({
    where: { date: dateKey, currency: "USD" },
    orderBy: { time: "asc" },
  });
}

export async function getEventsInRange(fromKey: string, toKey: string) {
  return prisma.economicEvent.findMany({
    where: {
      currency: "USD",
      impact: { in: ["High", "Medium"] },
      date: { gte: fromKey, lte: toKey },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
}

export async function getRedFolderTagsForDate(dateKey: string) {
  const events = await getEventsForDate(dateKey);
  return events.filter((e) => e.impact === "High").map((e) => e.title);
}
