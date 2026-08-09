import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseTags } from "@/lib/json";
import { stripHiddenFields } from "@/lib/tradeFields";

async function assertAcceptedFriend(userId: string, friendId: string) {
  const link = await prisma.friendLink.findFirst({
    where: {
      status: "accepted",
      OR: [
        { requesterId: userId, receiverId: friendId },
        { requesterId: friendId, receiverId: userId },
      ],
    },
  });
  return Boolean(link);
}

export async function GET(_req: NextRequest, { params }: { params: { friendId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isFriend = await assertAcceptedFriend(user.id, params.friendId);
  if (!isFriend) return NextResponse.json({ error: "Not friends with this user." }, { status: 403 });

  const friend = await prisma.user.findUnique({ where: { id: params.friendId } });
  if (!friend) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const trades = await prisma.trade.findMany({ where: { userId: friend.id }, orderBy: { date: "desc" } });

  const safeTrades = trades.map((t) => {
    const hidden = parseTags(t.hiddenFields);
    return stripHiddenFields({ ...t }, hidden);
  });

  return NextResponse.json({ friend: { id: friend.id, username: friend.username, displayName: friend.displayName }, trades: safeTrades });
}
