import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = (body.token || "").trim();
  const password = body.password || "";

  if (!token) return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.used || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
  ]);

  return NextResponse.json({ ok: true });
}
