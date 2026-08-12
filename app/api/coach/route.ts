import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getAnthropicClient, isCoachConfigured, buildCoachSystemPrompt, COACH_MODEL } from "@/lib/anthropic";
import { parseTags } from "@/lib/json";
import { parseDataUrl } from "@/lib/imageFile";
import { getCoachMessageLimit, MONTHLY_AI_MESSAGE_LIMIT } from "@/lib/plan";

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

async function countMessagesThisMonth(userId: string) {
  return prisma.coachMessage.count({
    where: { userId, role: "user", createdAt: { gte: startOfMonth() } },
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.coachMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  // Monthly Whop subscribers track usage against their actual billing period, not
  // the calendar month — everyone else keeps the existing calendar-month count.
  const limit = user.plan === "monthly" ? MONTHLY_AI_MESSAGE_LIMIT : getCoachMessageLimit(user.plan);
  const usedThisMonth = user.plan === "monthly" ? user.aiMessagesUsed : await countMessagesThisMonth(user.id);

  return NextResponse.json({
    messages,
    configured: isCoachConfigured(user.anthropicApiKey),
    usedThisMonth,
    limit: Number.isFinite(limit) ? limit : null,
    hasProfile: Boolean(user.traderProfile),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, imageUrl } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  if (!isCoachConfigured(user.anthropicApiKey)) {
    return NextResponse.json(
      { error: "No Anthropic API key configured. Add one on the Settings page to enable the AI Coach." },
      { status: 400 }
    );
  }

  const limit = user.plan === "monthly" ? MONTHLY_AI_MESSAGE_LIMIT : getCoachMessageLimit(user.plan);
  let finalUsedCount: number;

  if (user.plan === "monthly") {
    // Atomic increment guarded by the current count — closes the race window where
    // simultaneous requests could each pass a separate read-then-check and both succeed.
    const result = await prisma.user.updateMany({
      where: { id: user.id, aiMessagesUsed: { lt: limit } },
      data: { aiMessagesUsed: { increment: 1 } },
    });
    if (result.count === 0) {
      return NextResponse.json(
        { error: `You've used all ${limit} AI Coach messages included in your plan this billing period. Upgrade for more.` },
        { status: 429 }
      );
    }
    finalUsedCount = user.aiMessagesUsed + 1;
  } else {
    const usedThisMonth = await countMessagesThisMonth(user.id);
    if (usedThisMonth >= limit) {
      return NextResponse.json(
        { error: `You've used all ${limit} AI Coach messages included in your plan this month. Upgrade for more.` },
        { status: 429 }
      );
    }
    finalUsedCount = usedThisMonth + 1;
  }

  await prisma.coachMessage.create({
    data: { userId: user.id, role: "user", content: message, imageUrl: imageUrl || null },
  });

  const trades = await prisma.trade.findMany({ where: { userId: user.id } });
  const total = trades.length;
  const wins = trades.filter((t) => t.result === "Win").length;
  const losses = trades.filter((t) => t.result === "Loss").length;
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const rulesFollowedRate = total > 0 ? (trades.filter((t) => t.rulesFollowed).length / total) * 100 : 0;

  const setupCounts: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};
  for (const t of trades) {
    for (const tag of parseTags(t.setupTags)) setupCounts[tag] = (setupCounts[tag] || 0) + 1;
    for (const tag of parseTags(t.emotionTags)) emotionCounts[tag] = (emotionCounts[tag] || 0) + 1;
  }
  const topSetups = Object.entries(setupCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
  const topEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

  const systemPrompt = buildCoachSystemPrompt({
    instrument: user.instrument,
    totalTrades: total,
    winRate: total > 0 ? (wins / total) * 100 : 0,
    wins,
    losses,
    totalPnl,
    topSetups,
    topEmotions,
    rulesFollowedRate,
    traderProfile: user.traderProfile,
  });

  const history = await prisma.coachMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    take: 40,
  });

  const client = getAnthropicClient(user.anthropicApiKey);
  if (!client) {
    return NextResponse.json({ error: "AI Coach is not configured." }, { status: 400 });
  }

  const messagesForClaude = history.map((m) => {
    const image = m.imageUrl ? parseDataUrl(m.imageUrl) : null;
    if (!image) {
      return { role: m.role as "user" | "assistant", content: m.content };
    }
    return {
      role: m.role as "user" | "assistant",
      content: [
        { type: "image" as const, source: { type: "base64" as const, media_type: image.mediaType as any, data: image.base64 } },
        { type: "text" as const, text: m.content },
      ],
    };
  });

  try {
    const response = await client.messages.create({
      model: COACH_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messagesForClaude,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const replyText = textBlock && textBlock.type === "text" ? textBlock.text : "I couldn't generate a response — try again.";

    const saved = await prisma.coachMessage.create({ data: { userId: user.id, role: "assistant", content: replyText } });

    return NextResponse.json({ reply: saved, usedThisMonth: finalUsedCount, limit: Number.isFinite(limit) ? limit : null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Anthropic API request failed." }, { status: 502 });
  }
}
