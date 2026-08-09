import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const VALID_ROLES = ["user", "admin", "creator"];
const VALID_PLANS = ["trial", "monthly", "lifetime", "expired"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const data: Record<string, any> = {};
  if (VALID_ROLES.includes(body.role)) data.role = body.role;
  if (VALID_PLANS.includes(body.plan)) data.plan = body.plan;

  const updated = await prisma.user.update({ where: { id: params.id }, data });
  return NextResponse.json({ id: updated.id, role: updated.role, plan: updated.plan });
}
