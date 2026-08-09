import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEventsForDate, getEventsInRange, refreshEconomicCalendar } from "@/lib/economicCalendar";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (from && to) {
    const events = await getEventsInRange(from, to);
    return NextResponse.json(events);
  }

  if (!date) return NextResponse.json({ error: "date, or from/to, is required" }, { status: 400 });

  const events = await getEventsForDate(date);
  return NextResponse.json(events);
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await refreshEconomicCalendar();
  return NextResponse.json(result);
}
