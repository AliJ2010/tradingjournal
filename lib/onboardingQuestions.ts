export type OnboardingQuestion = {
  id: string;
  type: "single" | "multi" | "short" | "long";
  prompt: string;
  helper?: string;
  options?: string[];
};

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: "experience",
    type: "single",
    prompt: "How would you describe your trading experience?",
    options: ["New (under 6 months)", "Developing (6 months–2 years)", "Experienced but inconsistent", "Consistently profitable"],
  },
  {
    id: "markets",
    type: "multi",
    prompt: "Which markets do you trade?",
    options: ["Futures", "Forex", "Stocks", "Crypto", "Options", "Other"],
  },
  {
    id: "primaryInstrument",
    type: "short",
    prompt: "What's your primary trading instrument?",
    helper: "e.g. NQ, ES, EURUSD",
  },
  {
    id: "timeframe",
    type: "single",
    prompt: "What timeframe do you mainly trade?",
    options: ["Scalping (seconds–minutes)", "Intraday (minutes–hours)", "Swing (days)", "Position (weeks+)"],
  },
  {
    id: "riskTolerance",
    type: "single",
    prompt: "How would you describe your risk tolerance?",
    options: ["Conservative", "Moderate", "Aggressive"],
  },
  {
    id: "goal",
    type: "single",
    prompt: "What's your biggest goal right now?",
    options: ["Consistency", "Growing account size", "Discipline / psychology", "Developing a strategy", "Going full-time"],
  },
  {
    id: "emotionalTriggers",
    type: "multi",
    prompt: "Which emotions trip you up most when trading?",
    options: ["FOMO", "Revenge trading", "Fear / hesitation", "Overconfidence", "Impatience", "None really"],
  },
  {
    id: "biggestStruggle",
    type: "long",
    prompt: "In your own words, what's the one thing that's held you back the most as a trader?",
  },
  {
    id: "greatDay",
    type: "long",
    prompt: "What does a great trading day look like for you — not in PnL, but in process?",
  },
];

export function formatAnswersAsProfile(answers: Record<string, string | string[]>): string {
  const lines: string[] = [];
  for (const q of ONBOARDING_QUESTIONS) {
    const a = answers[q.id];
    if (!a || (Array.isArray(a) && a.length === 0)) continue;
    const value = Array.isArray(a) ? a.join(", ") : a;
    lines.push(`- ${q.prompt} ${value}`);
  }
  return lines.join("\n");
}
