import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const options = await prisma.savedTagOption.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  const grouped: Record<string, string[]> = {};
  for (const o of options) {
    if (!grouped[o.field]) grouped[o.field] = [];
    grouped[o.field].push(o.value);
  }

  return NextResponse.json(grouped);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const field = (body.field || "").trim();
  const value = (body.value || "").trim();
  if (!field || !value) return NextResponse.json({ error: "field and value are required." }, { status: 400 });

  await prisma.savedTagOption
    .create({ data: { userId: user.id, field, value } })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const field = (body.field || "").trim();
  const value = (body.value || "").trim();
  if (!field || !value) return NextResponse.json({ error: "field and value are required." }, { status: 400 });

  await prisma.savedTagOption.deleteMany({ where: { userId: user.id, field, value } });

  return NextResponse.json({ ok: true });
}
