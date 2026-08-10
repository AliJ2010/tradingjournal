import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPlanStatus } from "@/lib/plan";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    displayName: user.displayName,
    timezone: user.timezone,
    instrument: user.instrument,
    hasApiKey: Boolean(user.anthropicApiKey),
    apiKeyPreview: user.anthropicApiKey ? `••••${user.anthropicApiKey.slice(-4)}` : null,
    billing: getPlanStatus(user),
  });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, any> = {};

  if (typeof body.displayName === "string" && body.displayName.trim()) data.displayName = body.displayName.trim();
  if (typeof body.timezone === "string" && body.timezone) data.timezone = body.timezone;
  if (typeof body.instrument === "string" && body.instrument.trim()) data.instrument = body.instrument.trim().toUpperCase();
  if (body.clearApiKey) data.anthropicApiKey = null;
  else if (typeof body.anthropicApiKey === "string" && body.anthropicApiKey.trim()) data.anthropicApiKey = body.anthropicApiKey.trim();

  const updated = await prisma.user.update({ where: { id: user.id }, data });

  return NextResponse.json({
    displayName: updated.displayName,
    timezone: updated.timezone,
    instrument: updated.instrument,
    hasApiKey: Boolean(updated.anthropicApiKey),
    apiKeyPreview: updated.anthropicApiKey ? `••••${updated.anthropicApiKey.slice(-4)}` : null,
    billing: getPlanStatus(updated),
  });
}
