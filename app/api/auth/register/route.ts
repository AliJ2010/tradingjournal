import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createSessionCookie } from "@/lib/session";
import { sendVerificationEmail } from "@/lib/email";
import { isDisposableEmail } from "@/lib/disposableEmailDomains";
import crypto from "crypto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

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
  if (isDisposableEmail(email)) {
    return NextResponse.json({ error: "Please use a permanent email address — temporary/disposable providers aren't allowed." }, { status: 400 });
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

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      displayName,
      referredByCode: creatorCode ? creatorCode.code : null,
    },
  });

  if (creatorCode) {
    await prisma.referral.create({
      data: { creatorCodeId: creatorCode.id, referredUserId: user.id },
    });
  }

  const code = generateCode();
  await prisma.emailVerificationCode.create({
    data: { userId: user.id, code, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
  });

  await createSessionCookie({ userId: user.id, username: user.username });
  sendVerificationEmail(user.email, user.displayName, code).catch(() => {});

  return NextResponse.json({ id: user.id, username: user.username, displayName: user.displayName });
}
