"use client";

import type { FieldDef } from "@/lib/tradeFields";

const ICONS: Record<FieldDef["icon"], string> = {
  target: "◎",
  list: "☰",
  calendar: "📅",
  check: "☑",
  link: "🔗",
  smile: "🙂",
  clock: "🕐",
  image: "🖼️",
};

export default function PropertyRow({
  field,
  hidden,
  onToggleHidden,
  editable = true,
  children,
}: {
  field: FieldDef;
  hidden?: boolean;
  onToggleHidden?: () => void;
  editable?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="group flex items-start gap-3 py-3 border-b border-base-border/60 last:border-b-0 hover:bg-base-panel2/30 -mx-2 px-2 rounded-lg transition-colors">
      <div className="w-44 shrink-0 flex items-center gap-2 text-base-text/90 text-sm pt-1.5 field-label">
        <span className="text-xs opacity-70">{ICONS[field.icon]}</span>
        <span>{field.label}</span>
      </div>
      <div className="flex-1 min-w-0 pt-0.5">{children}</div>
      {editable && field.hideable && onToggleHidden && (
        <button
          type="button"
          onClick={onToggleHidden}
          title={hidden ? "Hidden from friends — click to show" : "Visible to friends — click to hide"}
          className={`shrink-0 mt-1 w-6 h-6 flex items-center justify-center rounded-md text-xs transition-all ${
            hidden
              ? "bg-pill-red-bg/20 text-pill-red-bg opacity-100"
              : "opacity-0 group-hover:opacity-100 text-base-muted hover:bg-base-panel2"
          }`}
        >
          {hidden ? "✕" : "👁"}
        </button>
      )}
    </div>
  );
}
