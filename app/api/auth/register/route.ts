import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createSessionCookie } from "@/lib/session";
import { sendWelcomeEmail } from "@/lib/email";
import { TRIAL_DAYS } from "@/lib/plan";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const username = (body.username || "").trim().toLowerCase();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const displayName = (body.displayName || username).trim();
  const refCode = (body.refCode || "").trim();

  if (!username || username.length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json({ error: "That email is already registered." }, { status: 409 });
  }

  let creatorCode = null;
  if (refCode) {
    creatorCode = await prisma.creatorCode.findUnique({ where: { code: refCode } });
  }

  const passwordHash = await hashPassword(password);
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      displayName,
      trialEndsAt,
      referredByCode: creatorCode ? creatorCode.code : null,
    },
  });

  if (creatorCode) {
    await prisma.referral.create({
      data: { creatorCodeId: creatorCode.id, referredUserId: user.id },
    });
  }

  await createSessionCookie({ userId: user.id, username: user.username });
  sendWelcomeEmail(user.email, user.displayName).catch(() => {});

  return NextResponse.json({ id: user.id, username: user.username, displayName: user.displayName });
}
