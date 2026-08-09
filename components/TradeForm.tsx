"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropertyRow from "./PropertyRow";
import PillBadge, { colorForTag, colorForEmotion } from "./PillBadge";
import NewsBanner from "./NewsBanner";
import ImageDropField from "./ImageDropField";
import { TRADE_FIELDS, EMOTION_TAG_SUGGESTIONS, type FieldDef } from "@/lib/tradeFields";
import { isWeekendDate } from "@/lib/tradeDate";

export type TradeDraft = {
  id?: string;
  date: string;
  result: string;
  direction: string;
  htfBias: string;
  instrument: string;
  entryTime: string;
  exitTime: string;
  riskPercent: number;
  rulesFollowed: boolean;
  rr: string;
  pnl: number;
  drawDirectionTags: string[];
  setupTags: string[];
  emotionTags: string[];
  newsTags: string[];
  whatOthersDid: string;
  notes: string;
  whatWouldYouDo: string;
  chartImageUrl: string;
  hiddenFields: string[];
};

export function emptyDraft(date = new Date().toISOString().slice(0, 10)): TradeDraft {
  return {
    date,
    result: "Loss",
    direction: "Long",
    htfBias: "Neutral",
    instrument: "",
    entryTime: "",
    exitTime: "",
    riskPercent: 1,
    rulesFollowed: true,
    rr: "",
    pnl: 0,
    drawDirectionTags: [],
    setupTags: [],
    emotionTags: [],
    newsTags: [],
    whatOthersDid: "",
    notes: "",
    whatWouldYouDo: "",
    chartImageUrl: "",
    hiddenFields: [],
  };
}

function TagInput({
  values,
  onChange,
  suggestions,
  disabled,
  colorFn = colorForTag,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  suggestions: string[];
  disabled?: boolean;
  colorFn?: (tag: string) => ReturnType<typeof colorForTag>;
}) {
  const [input, setInput] = useState("");

  function addTag(tag: string) {
    const clean = tag.trim();
    if (!clean || values.includes(clean)) return;
    onChange([...values, clean]);
    setInput("");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {values.map((v) => (
        <PillBadge key={v} label={v} color={colorFn(v)} onRemove={disabled ? undefined : () => onChange(values.filter((x) => x !== v))} />
      ))}
      {!disabled && (
        <input
          list={suggestions.length > 0 ? `suggestions-${suggestions.join("-").slice(0, 20)}` : undefined}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(input);
            }
          }}
          onBlur={() => input && addTag(input)}
          placeholder="+ Add"
          className="bg-transparent text-sm text-base-muted placeholder:text-base-muted/60 w-24 px-1 py-1"
        />
      )}
      {suggestions.length > 0 && (
        <datalist id={`suggestions-${suggestions.join("-").slice(0, 20)}`}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </div>
  );
}

function SelectPills({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  if (disabled) {
    const opt = field.options?.find((o) => o.value === value);
    return value ? <PillBadge label={value} color={opt?.color || "slate"} /> : <span className="text-base-muted text-sm">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {field.options?.map((opt) => (
        <button
          type="button"
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={value === opt.value ? "" : "opacity-40 hover:opacity-80 transition-opacity"}
        >
          <PillBadge label={opt.value} color={opt.color} />
        </button>
      ))}
    </div>
  );
}

export default function TradeForm({
  initial,
  readOnly = false,
  onSave,
  onDelete,
  onCancel,
}: {
  initial: TradeDraft;
  readOnly?: boolean;
  onSave?: (draft: TradeDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<TradeDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [dateError, setDateError] = useState("");
  const [saveButtonVisible, setSaveButtonVisible] = useState(true);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setDraft(initial), [initial]);

  useEffect(() => {
    if (readOnly || !onSave || !saveButtonRef.current) return;
    const el = saveButtonRef.current;
    const observer = new IntersectionObserver(([entry]) => setSaveButtonVisible(entry.isIntersecting), { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [readOnly, onSave, draft.id]);

  function set<K extends keyof TradeDraft>(key: K, value: TradeDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggleHidden(key: string) {
    set("hiddenFields", draft.hiddenFields.includes(key) ? draft.hiddenFields.filter((k) => k !== key) : [...draft.hiddenFields, key]);
  }

  async function handleSave() {
    if (!onSave) return;
    setSaving(true);
    setSaveError("");
    try {
      await onSave(draft);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err: any) {
      setSaveError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const hidden = new Set(draft.hiddenFields);

  return (
    <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
      <AnimatePresence>
        {!readOnly && onSave && !saveButtonVisible && (
          <motion.button
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            onClick={handleSave}
            disabled={saving}
            className="fixed top-4 right-4 sm:right-6 z-30 bg-brand-gradient text-white font-semibold rounded-full px-5 py-2.5 text-sm shadow-glow hover:brightness-110 transition-all disabled:opacity-60"
          >
            {saving ? "Saving..." : justSaved ? "Saved!" : "Save entry?"}
          </motion.button>
        )}
      </AnimatePresence>

      <div className="px-6 pt-6 pb-2">
        <div className="text-2xl font-semibold tracking-tight">
          {new Date(draft.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </div>
      </div>

      <div className="px-6">
        <div className="mb-4">
          <NewsBanner date={draft.date} />
        </div>
      </div>

      <div className="px-6 pb-6">
        {TRADE_FIELDS.map((field, i) => {
          const isHidden = hidden.has(field.key);
          if (readOnly && isHidden) {
            return (
              <PropertyRow key={field.key} field={field} editable={false}>
                <span className="text-base-muted text-sm italic">🔒 hidden by owner</span>
              </PropertyRow>
            );
          }

          return (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.015, 0.3) }}
            >
              <PropertyRow field={field} hidden={isHidden} onToggleHidden={readOnly ? undefined : () => toggleHidden(field.key)} editable={!readOnly}>
                {field.type === "select" && (
                  <SelectPills field={field} value={(draft as any)[field.key]} onChange={(v) => set(field.key as any, v as any)} disabled={readOnly} />
                )}

                {field.type === "date" &&
                  (readOnly ? (
                    <span className="text-sm">{draft.date}</span>
                  ) : (
                    <div>
                      <input
                        type="date"
                        value={draft.date}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value && isWeekendDate(value)) {
                            setDateError("Markets are closed on weekends — pick a weekday.");
                            return;
                          }
                          setDateError("");
                          set("date", value);
                        }}
                        className="bg-base-panel2 border border-base-border rounded-md px-2 py-1 text-sm"
                      />
                      {dateError && <p className="text-xs text-pill-red-bg mt-1">{dateError}</p>}
                    </div>
                  ))}

                {field.type === "time" &&
                  (readOnly ? (
                    <span className="text-sm">{(draft as any)[field.key] || <span className="text-base-muted">—</span>}</span>
                  ) : (
                    <input
                      type="time"
                      value={(draft as any)[field.key]}
                      onChange={(e) => set(field.key as any, e.target.value as any)}
                      className="bg-base-panel2 border border-base-border rounded-md px-2 py-1 text-sm"
                    />
                  ))}

                {field.type === "readonly-tags" && (
                  <div className="flex flex-wrap gap-1.5">
                    {draft.newsTags.length === 0 && <span className="text-base-muted text-sm">No red folder news detected</span>}
                    {draft.newsTags.map((t) => (
                      <PillBadge key={t} label={t} color="red" />
                    ))}
                  </div>
                )}

                {field.type === "tags" && (
                  <TagInput
                    values={(draft as any)[field.key]}
                    onChange={(v) => set(field.key as any, v as any)}
                    suggestions={field.key === "emotionTags" ? EMOTION_TAG_SUGGESTIONS : []}
                    disabled={readOnly}
                    colorFn={field.key === "emotionTags" ? colorForEmotion : colorForTag}
                  />
                )}

                {field.type === "image" && (
                  <ImageDropField value={draft.chartImageUrl} onChange={(url) => set("chartImageUrl", url)} readOnly={readOnly} />
                )}

                {field.type === "text" &&
                  (readOnly ? (
                    (draft as any)[field.key] ? (
                      <span className="text-sm">{(draft as any)[field.key]}</span>
                    ) : (
                      <span className="text-base-muted text-sm">—</span>
                    )
                  ) : (
                    <input
                      type="text"
                      value={(draft as any)[field.key]}
                      onChange={(e) => set(field.key as any, e.target.value as any)}
                      placeholder="Empty"
                      className="bg-transparent text-sm w-full placeholder:text-base-muted/60 py-1"
                    />
                  ))}

                {field.type === "number" &&
                  (readOnly ? (
                    <PillBadge
                      color={
                        field.key === "pnl"
                          ? ((draft.result === "Win"
                              ? "green"
                              : draft.result === "Loss"
                              ? "red"
                              : draft.result === "Breakeven"
                              ? "gold"
                              : "slate") as any)
                          : "blue"
                      }
                      label={field.key === "riskPercent" ? `$${draft.riskPercent.toFixed(2)}` : `$${draft.pnl.toFixed(2)}`}
                    />
                  ) : (
                    <input
                      type="number"
                      step="any"
                      value={(draft as any)[field.key]}
                      onChange={(e) => set(field.key as any, Number(e.target.value) as any)}
                      className="bg-base-panel2 border border-base-border rounded-md px-2 py-1 text-sm w-28"
                    />
                  ))}

                {field.type === "boolean" && (
                  <input
                    type="checkbox"
                    checked={draft.rulesFollowed}
                    disabled={readOnly}
                    onChange={(e) => set("rulesFollowed", e.target.checked)}
                    className="w-5 h-5 rounded accent-accent"
                  />
                )}

                {field.type === "textarea" &&
                  (readOnly ? (
                    <div className="text-sm whitespace-pre-wrap text-base-text/90">{(draft as any)[field.key] || <span className="text-base-muted">—</span>}</div>
                  ) : (
                    <textarea
                      value={(draft as any)[field.key]}
                      onChange={(e) => set(field.key as any, e.target.value as any)}
                      placeholder="Empty"
                      rows={field.key === "notes" ? 5 : 3}
                      className="bg-base-panel2 border border-base-border rounded-md px-2 py-1.5 text-sm w-full placeholder:text-base-muted/60 resize-y"
                    />
                  ))}
              </PropertyRow>
            </motion.div>
          );
        })}
      </div>

      {!readOnly && saveError && <p className="px-6 pb-2 text-sm text-pill-red-bg">{saveError}</p>}

      {!readOnly && (
        <div className="px-6 pb-8 flex items-center gap-3">
          <motion.button
            ref={saveButtonRef}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-gradient text-white font-semibold rounded-lg px-6 py-3 text-base shadow-glow hover:brightness-110 transition-all disabled:opacity-60"
          >
            {saving ? "Saving..." : justSaved ? "Saved!" : "Save entry"}
          </motion.button>
          {onCancel && (
            <button onClick={onCancel} className="text-sm text-base-muted hover:text-base-text px-3 py-2">
              Cancel
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="ml-auto text-base font-medium text-pill-red-bg border border-pill-red-bg/40 rounded-lg px-5 py-3 hover:bg-pill-red-bg/10 transition-colors"
            >
              Delete entry
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
