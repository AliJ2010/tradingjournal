import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(codes);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const code = (body.code || "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Code is required." }, { status: 400 });

  const existing = await prisma.discountCode.findUnique({ where: { code } });
  if (existing) return NextResponse.json({ error: "That code already exists." }, { status: 409 });

  const planKeys: string[] = Array.isArray(body.planKeys) && body.planKeys.length > 0 ? body.planKeys : ["monthly", "lifetime"];

  const created = await prisma.discountCode.create({
    data: {
      code,
      percentOff: body.percentOff ? Number(body.percentOff) : null,
      amountOffCents: body.amountOffCents ? Number(body.amountOffCents) : null,
      maxRedemptions: body.maxRedemptions ? Number(body.maxRedemptions) : null,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      planKeys: JSON.stringify(planKeys),
    },
  });

  return NextResponse.json(created);
}
