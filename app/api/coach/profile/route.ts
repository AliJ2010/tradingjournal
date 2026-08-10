import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatAnswersAsProfile } from "@/lib/onboardingQuestions";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { answers } = await req.json();
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "answers is required" }, { status: 400 });
  }

  const traderProfile = formatAnswersAsProfile(answers);
  await prisma.user.update({ where: { id: user.id }, data: { traderProfile } });

  return NextResponse.json({ traderProfile });
}
