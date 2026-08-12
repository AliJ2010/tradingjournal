import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const data: Record<string, any> = {};
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.whopAffiliateId === "string") data.whopAffiliateId = body.whopAffiliateId.trim() || null;
  if (typeof body.whopAffiliateCode === "string") data.whopAffiliateCode = body.whopAffiliateCode.trim() || null;

  const updated = await prisma.creatorCode.update({ where: { id: params.id }, data, include: { planRules: true } });
  return NextResponse.json(updated);
}
