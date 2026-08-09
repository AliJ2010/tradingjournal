export type FieldType = "select" | "tags" | "text" | "textarea" | "number" | "boolean" | "date" | "time" | "image" | "readonly-tags";

export type PillColor = "red" | "green" | "blue" | "orange" | "gold" | "slate" | "purple" | "teal";

export type FieldDef = {
  key: string;
  label: string;
  icon: "target" | "list" | "calendar" | "check" | "link" | "smile" | "clock" | "image";
  type: FieldType;
  options?: { value: string; color: PillColor }[];
  hideable: boolean;
};

export const TRADE_FIELDS: FieldDef[] = [
  {
    key: "result",
    label: "Result",
    icon: "target",
    type: "select",
    hideable: true,
    options: [
      { value: "Win", color: "green" },
      { value: "Loss", color: "red" },
      { value: "Breakeven", color: "slate" },
    ],
  },
  {
    key: "direction",
    label: "Trade Direction",
    icon: "target",
    type: "select",
    hideable: true,
    options: [
      { value: "Long", color: "green" },
      { value: "Short", color: "red" },
    ],
  },
  {
    key: "htfBias",
    label: "HTF bias",
    icon: "target",
    type: "select",
    hideable: true,
    options: [
      { value: "Bullish", color: "green" },
      { value: "Bearish", color: "red" },
      { value: "Neutral", color: "slate" },
    ],
  },
  { key: "date", label: "Date", icon: "calendar", type: "date", hideable: false },
  { key: "entryTime", label: "Entry Time", icon: "clock", type: "time", hideable: true },
  { key: "exitTime", label: "Exit Time", icon: "clock", type: "time", hideable: true },
  { key: "newsTags", label: "News today?", icon: "list", type: "readonly-tags", hideable: true },
  { key: "riskPercent", label: "Risk ($)", icon: "list", type: "number", hideable: true },
  { key: "drawDirectionTags", label: "Draw Direction", icon: "list", type: "tags", hideable: true },
  { key: "setupTags", label: "Setup/Model", icon: "list", type: "tags", hideable: true },
  { key: "emotionTags", label: "Emotional State", icon: "smile", type: "tags", hideable: true },
  { key: "rulesFollowed", label: "Rules followed?", icon: "check", type: "boolean", hideable: true },
  { key: "rr", label: "RR", icon: "list", type: "text", hideable: true },
  { key: "whatOthersDid", label: "What did others do?", icon: "list", type: "textarea", hideable: true },
  { key: "notes", label: "Notes/Reflection", icon: "list", type: "textarea", hideable: true },
  { key: "whatWouldYouDo", label: "What would you do differently?", icon: "list", type: "textarea", hideable: true },
  { key: "chartImageUrl", label: "Chart Screenshot", icon: "image", type: "image", hideable: true },
  { key: "pnl", label: "PnL", icon: "list", type: "number", hideable: true },
];

export const SETUP_TAG_SUGGESTIONS = [
  "LTF Sweep",
  "5m BOS",
  "5m FVG",
  "Highest TF FVG",
  "HTF PD Array",
  "Midnight Open",
  "London Sweep",
  "NY Reversal",
  "Silver Bullet",
];

export const EMOTION_TAG_SUGGESTIONS = [
  "Calm",
  "In Control",
  "Anxious",
  "Revenge Trading",
  "FOMO",
  "Confident",
  "Hesitant",
  "Overconfident",
];

export const DRAW_DIRECTION_SUGGESTIONS = ["IRL -> ERL", "ERL -> IRL", "HTF PD Array", "Range Bound"];

export function stripHiddenFields<T extends Record<string, any>>(trade: T, hiddenFields: string[]): T {
  const copy: Record<string, any> = { ...trade };
  for (const key of hiddenFields) {
    if (key in copy) copy[key] = null;
  }
  copy.hiddenFields = JSON.stringify(hiddenFields);
  return copy as T;
}
