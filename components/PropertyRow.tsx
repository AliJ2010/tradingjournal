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
    <div className="group flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-3 py-3 border-b border-base-border/60 last:border-b-0 hover:bg-base-panel2/30 -mx-2 px-2 rounded-lg transition-colors">
      <div className="sm:w-44 sm:shrink-0 flex items-center gap-2 text-base-text/90 text-sm sm:pt-1.5 field-label">
        <span className="text-xs opacity-70">{ICONS[field.icon]}</span>
        <span>{field.label}</span>
      </div>
      <div className="flex-1 min-w-0 sm:pt-0.5 flex items-start gap-2">
        <div className="flex-1 min-w-0">{children}</div>
        {editable && field.hideable && onToggleHidden && (
          <div className="relative shrink-0">
            {!hidden && (
              <div className="hidden sm:group-hover:flex absolute right-full top-1/2 -translate-y-1/2 mr-1.5 items-center whitespace-nowrap pointer-events-none">
                <span className="bg-base-panel2 border border-base-border text-base-muted text-xs px-2 py-1 rounded-md">
                  Hide so friends don't see this
                </span>
                <span className="w-0 h-0 border-y-4 border-y-transparent border-l-4 border-l-base-border -ml-px" />
              </div>
            )}
            <button
              type="button"
              onClick={onToggleHidden}
              title={hidden ? "Hidden from friends — click to show" : "Visible to friends — click to hide"}
              className={`mt-1 w-9 h-9 flex items-center justify-center rounded-md text-lg transition-all ${
                hidden
                  ? "bg-pill-red-bg/20 text-pill-red-bg opacity-100"
                  : "opacity-70 sm:opacity-0 sm:group-hover:opacity-100 text-base-muted hover:bg-base-panel2"
              }`}
            >
              {hidden ? "✕" : "👁"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
