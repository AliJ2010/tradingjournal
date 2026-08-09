import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail, getBaseUrl } from "@/lib/email";
import crypto from "crypto";

const GENERIC_MESSAGE = "If an account with that email exists, we've sent a password reset link.";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = (body.email || "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Enter your email address." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

    const resetUrl = `${getBaseUrl()}/reset-password?token=${token}`;
    sendPasswordResetEmail(user.email, user.displayName, resetUrl).catch(() => {});
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
