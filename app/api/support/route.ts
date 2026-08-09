import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const message = (body.message || "").trim();

  if (!name || !EMAIL_RE.test(email) || !message) {
    return NextResponse.json({ error: "Fill in your name, a valid email, and a message." }, { status: 400 });
  }

  await prisma.supportMessage.create({ data: { name, email, message } });
  return NextResponse.json({ ok: true });
}
