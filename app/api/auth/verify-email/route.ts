import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { TRIAL_DAYS } from "@/lib/plan";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.emailVerified) return NextResponse.json({ ok: true });

  const { code } = await req.json();
  const clean = (code || "").trim();
  if (!clean) return NextResponse.json({ error: "Enter the code from your email." }, { status: 400 });

  const record = await prisma.emailVerificationCode.findFirst({
    where: { userId: user.id, code: clean, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "That code is invalid or has expired." }, { status: 400 });
  }

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.emailVerificationCode.update({ where: { id: record.id }, data: { used: true } }),
    prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, trialEndsAt } }),
  ]);

  sendWelcomeEmail(user.email, user.displayName).catch(() => {});

  return NextResponse.json({ ok: true });
}
