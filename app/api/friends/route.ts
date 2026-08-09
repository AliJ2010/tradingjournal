import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const links = await prisma.friendLink.findMany({
    where: { OR: [{ requesterId: user.id }, { receiverId: user.id }] },
    include: { requester: true, receiver: true },
    orderBy: { createdAt: "desc" },
  });

  const shaped = links.map((l) => {
    const isRequester = l.requesterId === user.id;
    const other = isRequester ? l.receiver : l.requester;
    return {
      id: l.id,
      status: l.status,
      direction: isRequester ? "outgoing" : "incoming",
      friend: { id: other.id, username: other.username, displayName: other.displayName },
    };
  });

  return NextResponse.json(shaped);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "send") {
    const username = (body.username || "").trim().toLowerCase();
    if (!username) return NextResponse.json({ error: "Username is required." }, { status: 400 });
    if (username === user.username) return NextResponse.json({ error: "You can't friend yourself." }, { status: 400 });

    const target = await prisma.user.findUnique({ where: { username } });
    if (!target) return NextResponse.json({ error: "No user with that username." }, { status: 404 });

    const existing = await prisma.friendLink.findFirst({
      where: {
        OR: [
          { requesterId: user.id, receiverId: target.id },
          { requesterId: target.id, receiverId: user.id },
        ],
      },
    });
    if (existing) return NextResponse.json({ error: "A friend link already exists with this user." }, { status: 409 });

    const link = await prisma.friendLink.create({
      data: { requesterId: user.id, receiverId: target.id, status: "pending" },
    });
    return NextResponse.json(link);
  }

  if (body.action === "accept" || body.action === "decline") {
    const link = await prisma.friendLink.findUnique({ where: { id: body.linkId } });
    if (!link || link.receiverId !== user.id) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    if (body.action === "decline") {
      await prisma.friendLink.delete({ where: { id: link.id } });
      return NextResponse.json({ ok: true });
    }
    const updated = await prisma.friendLink.update({ where: { id: link.id }, data: { status: "accepted" } });
    return NextResponse.json(updated);
  }

  if (body.action === "remove") {
    const link = await prisma.friendLink.findUnique({ where: { id: body.linkId } });
    if (!link || (link.requesterId !== user.id && link.receiverId !== user.id)) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    await prisma.friendLink.delete({ where: { id: link.id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
