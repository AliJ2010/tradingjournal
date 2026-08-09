import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { serializeTags } from "@/lib/json";
import { getRedFolderTagsForDate } from "@/lib/economicCalendar";
import { toDayKey } from "@/lib/streak";
import { signPnl } from "@/lib/pnl";
import { isWeekendDate } from "@/lib/tradeDate";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const trades = await prisma.trade.findMany({
    where: {
      userId: user.id,
      ...(from && to ? { date: { gte: new Date(from), lte: new Date(to) } } : {}),
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(trades);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const date = new Date(body.date || Date.now());
  if (isWeekendDate(date)) {
    return NextResponse.json({ error: "Markets are closed on weekends — pick a weekday." }, { status: 400 });
  }
  const dayKey = toDayKey(date);
  const newsTags = await getRedFolderTagsForDate(dayKey).catch(() => [] as string[]);
  const result = body.result || "Loss";

  const trade = await prisma.trade.create({
    data: {
      userId: user.id,
      date,
      result,
      direction: body.direction || "Long",
      htfBias: body.htfBias || "Neutral",
      instrument: body.instrument || "",
      entryTime: body.entryTime || "",
      exitTime: body.exitTime || "",
      riskPercent: Number(body.riskPercent) || 0,
      rulesFollowed: Boolean(body.rulesFollowed),
      rr: body.rr || "",
      pnl: signPnl(Number(body.pnl) || 0, result),
      drawDirectionTags: serializeTags(body.drawDirectionTags || []),
      setupTags: serializeTags(body.setupTags || []),
      emotionTags: serializeTags(body.emotionTags || []),
      newsTags: serializeTags(newsTags),
      whatOthersDid: body.whatOthersDid || "",
      notes: body.notes || "",
      whatWouldYouDo: body.whatWouldYouDo || "",
      chartImageUrl: body.chartImageUrl || "",
      hiddenFields: serializeTags(body.hiddenFields || []),
    },
  });

  return NextResponse.json(trade);
}
