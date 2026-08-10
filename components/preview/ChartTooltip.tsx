export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; color?: string }>;
  label?: string | number;
  labelFormatter?: (label: string | number) => string;
  valueFormatter?: (value: number, name?: string) => string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-base-panel border border-base-border rounded-md px-3 py-2 text-xs min-w-[120px]">
      {label !== undefined && (
        <div className="text-base-muted mb-1 pb-1 border-b border-base-border/60">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      )}
      <div className="space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            {p.name && (
              <span className="flex items-center gap-1.5 text-base-muted">
                {p.color && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: p.color }} />}
                {p.name}
              </span>
            )}
            <span className="font-medium text-base-text">{valueFormatter ? valueFormatter(p.value, p.name) : p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
