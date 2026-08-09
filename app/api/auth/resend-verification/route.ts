import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.emailVerified) return NextResponse.json({ ok: true });

  const recent = await prisma.emailVerificationCode.findFirst({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 30 * 1000) } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    return NextResponse.json({ error: "Wait a moment before requesting another code." }, { status: 429 });
  }

  const code = generateCode();
  await prisma.emailVerificationCode.create({
    data: { userId: user.id, code, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
  });

  sendVerificationEmail(user.email, user.displayName, code).catch(() => {});

  return NextResponse.json({ ok: true });
}
