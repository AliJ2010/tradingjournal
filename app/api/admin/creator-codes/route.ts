import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const codes = await prisma.creatorCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { creator: { select: { username: true, displayName: true } }, _count: { select: { referrals: true } } },
  });

  return NextResponse.json(codes);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const username = (body.username || "").trim().toLowerCase();
  const code = (body.code || "").trim().toUpperCase();
  const commissionPercent = body.commissionPercent ? Number(body.commissionPercent) : 10;

  if (!username || !code) {
    return NextResponse.json({ error: "Username and code are required." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { username } });
  if (!target) return NextResponse.json({ error: "No user with that username." }, { status: 404 });

  const existingCode = await prisma.creatorCode.findUnique({ where: { code } });
  if (existingCode) return NextResponse.json({ error: "That code already exists." }, { status: 409 });

  const existingForUser = await prisma.creatorCode.findUnique({ where: { creatorUserId: target.id } });
  if (existingForUser) return NextResponse.json({ error: "That user already has a creator code." }, { status: 409 });

  const [created] = await prisma.$transaction([
    prisma.creatorCode.create({ data: { code, creatorUserId: target.id, commissionPercent } }),
    prisma.user.update({ where: { id: target.id }, data: { role: "creator" } }),
  ]);

  return NextResponse.json(created);
}
