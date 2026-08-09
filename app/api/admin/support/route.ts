import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const messages = await prisma.supportMessage.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(messages);
}
