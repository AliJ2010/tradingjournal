import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { serializeTags } from "@/lib/json";
import { getRedFolderTagsForDate } from "@/lib/economicCalendar";
import { toDayKey } from "@/lib/streak";
import { signPnl } from "@/lib/pnl";
import { isWeekendDate } from "@/lib/tradeDate";

async function loadOwnedTrade(id: string, userId: string) {
  const trade = await prisma.trade.findUnique({ where: { id } });
  if (!trade || trade.userId !== userId) return null;
  return trade;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trade = await loadOwnedTrade(params.id, user.id);
  if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(trade);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await loadOwnedTrade(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const date = new Date(body.date || existing.date);
  if (isWeekendDate(date)) {
    return NextResponse.json({ error: "Markets are closed on weekends — pick a weekday." }, { status: 400 });
  }
  const dayKey = toDayKey(date);
  const newsTags = await getRedFolderTagsForDate(dayKey).catch(() => [] as string[]);
  const result = body.result;

  const trade = await prisma.trade.update({
    where: { id: params.id },
    data: {
      date,
      result,
      direction: body.direction,
      htfBias: body.htfBias,
      instrument: body.instrument,
      entryTime: body.entryTime,
      exitTime: body.exitTime,
      riskPercent: Number(body.riskPercent) || 0,
      rulesFollowed: Boolean(body.rulesFollowed),
      rr: body.rr,
      pnl: signPnl(Number(body.pnl) || 0, result),
      drawDirectionTags: serializeTags(body.drawDirectionTags || []),
      setupTags: serializeTags(body.setupTags || []),
      emotionTags: serializeTags(body.emotionTags || []),
      newsTags: serializeTags(newsTags),
      whatOthersDid: body.whatOthersDid,
      notes: body.notes,
      whatWouldYouDo: body.whatWouldYouDo,
      chartImageUrl: body.chartImageUrl,
      hiddenFields: serializeTags(body.hiddenFields || []),
    },
  });

  return NextResponse.json(trade);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await loadOwnedTrade(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.trade.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
