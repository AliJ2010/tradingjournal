import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const friendId = req.nextUrl.searchParams.get("friendId");
  if (friendId) {
    const reactions = await prisma.journalReaction.findMany({ where: { toUserId: friendId } });
    const byDay: Record<string, { count: number; reactedByMe: boolean }> = {};
    for (const r of reactions) {
      if (!byDay[r.dateKey]) byDay[r.dateKey] = { count: 0, reactedByMe: false };
      byDay[r.dateKey].count += 1;
      if (r.fromUserId === user.id) byDay[r.dateKey].reactedByMe = true;
    }
    return NextResponse.json(byDay);
  }

  const unseen = await prisma.journalReaction.findMany({
    where: { toUserId: user.id, seen: false },
    include: { from: true },
    orderBy: { createdAt: "asc" },
  });

  const allReceived = await prisma.journalReaction.findMany({
    where: { toUserId: user.id },
    include: { from: true },
  });
  const byDay: Record<string, { count: number; names: string[] }> = {};
  for (const r of allReceived) {
    if (!byDay[r.dateKey]) byDay[r.dateKey] = { count: 0, names: [] };
    byDay[r.dateKey].count += 1;
    byDay[r.dateKey].names.push(r.from.displayName);
  }

  return NextResponse.json({
    unseenCount: unseen.length,
    unseen: unseen.map((r) => ({
      id: r.id,
      dateKey: r.dateKey,
      fromDisplayName: r.from.displayName,
      fromUsername: r.from.username,
    })),
    byDay,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body.action === "markSeen") {
    await prisma.journalReaction.updateMany({ where: { toUserId: user.id, seen: false }, data: { seen: true } });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "toggle") {
    const toUserId = body.toUserId as string;
    const dateKey = body.dateKey as string;
    if (!toUserId || !dateKey) return NextResponse.json({ error: "toUserId and dateKey are required." }, { status: 400 });
    if (toUserId === user.id) return NextResponse.json({ error: "Can't react to your own journal." }, { status: 400 });

    const existing = await prisma.journalReaction.findUnique({
      where: { fromUserId_toUserId_dateKey: { fromUserId: user.id, toUserId, dateKey } },
    });
    if (existing) {
      await prisma.journalReaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ reacted: false });
    }
    await prisma.journalReaction.create({ data: { fromUserId: user.id, toUserId, dateKey } });
    return NextResponse.json({ reacted: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
