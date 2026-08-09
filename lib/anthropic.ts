import Anthropic from "@anthropic-ai/sdk";

export function isCoachConfigured(userApiKey?: string | null) {
  return Boolean(userApiKey || process.env.ANTHROPIC_API_KEY);
}

export function getAnthropicClient(userApiKey?: string | null) {
  const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export const COACH_MODEL = "claude-sonnet-5";

export function buildCoachSystemPrompt(stats: {
  instrument: string;
  totalTrades: number;
  winRate: number;
  wins: number;
  losses: number;
  totalPnl: number;
  topSetups: string[];
  topEmotions: string[];
  rulesFollowedRate: number;
}) {
  return `You are a sharp, direct trading coach for a discretionary trader who trades ${stats.instrument}.

Their current stats:
- Total logged trades: ${stats.totalTrades}
- Win rate: ${stats.winRate.toFixed(1)}%
- Wins: ${stats.wins}, Losses: ${stats.losses}
- Total PnL: $${stats.totalPnl.toFixed(2)}
- Most common setups: ${stats.topSetups.join(", ") || "not enough data yet"}
- Most common emotional states while trading: ${stats.topEmotions.join(", ") || "not enough data yet"}
- Rules-followed rate: ${stats.rulesFollowedRate.toFixed(0)}%

Use this data — including the specific setup/model tags and emotional-state tags they use — to ground your advice in their actual patterns and vocabulary. Be honest and specific rather than generic — call out discipline issues (like a low rules-followed rate, or emotional states correlated with losses) when relevant. Keep answers focused and actionable, not long-winded. Never give financial advice about what to trade next — focus on process, psychology, and pattern review of what they've already logged.`;
}
