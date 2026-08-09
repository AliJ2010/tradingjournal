import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, isCoachConfigured, COACH_MODEL } from "@/lib/anthropic";

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_PER_HOUR = 15;

function checkRateLimit(ip: string) {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= MAX_PER_HOUR) return false;
  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `You are the support assistant on OpticTrader's public marketing website (not logged-in users, just visitors). OpticTrader is a trading journal web app with:

- A journal for logging trades (setup tags, emotional state, entry/exit time, chart screenshots, PnL)
- A calendar showing win/loss days and a logging streak
- A dashboard with win rate, PnL, equity curve, and setup breakdown
- An AI Coach chat that gives personalized feedback based on a trader's logged history, with a monthly message allowance depending on plan
- A Friends feature to share progress with one other trader, with per-field privacy controls
- CSV and PDF export of the journal
- Pricing: Basic $15/mo (50 AI Coach messages/mo), Monthly $30/mo (200 messages/mo, Friends, PDF export), Lifetime $150 one-time (unlimited messages). A 5-day free trial is available on signup. Billing isn't live yet — plans are shown for preview.

Answer visitor questions about these features and pricing concisely and helpfully. If asked something unrelated to OpticTrader, politely redirect to what OpticTrader does. Never claim to have access to any specific user's data — you're talking to an anonymous visitor.`;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many questions right now — try again in a bit." }, { status: 429 });
  }

  const { message, history } = await req.json();
  if (!message || typeof message !== "string" || message.length > 500) {
    return NextResponse.json({ error: "Message is required (max 500 characters)." }, { status: 400 });
  }

  if (!isCoachConfigured()) {
    return NextResponse.json({ error: "Chat isn't configured right now." }, { status: 400 });
  }

  const client = getAnthropicClient();
  if (!client) return NextResponse.json({ error: "Chat isn't configured right now." }, { status: 400 });

  const priorMessages = Array.isArray(history)
    ? history.slice(-8).map((m: any) => ({
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: String(m.content || "").slice(0, 1000),
      }))
    : [];

  try {
    const response = await client.messages.create({
      model: COACH_MODEL,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [...priorMessages, { role: "user", content: message }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const reply = textBlock && textBlock.type === "text" ? textBlock.text : "Sorry, I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json({ error: "Something went wrong — try again." }, { status: 502 });
  }
}
