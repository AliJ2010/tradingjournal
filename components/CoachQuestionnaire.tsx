"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ONBOARDING_QUESTIONS } from "@/lib/onboardingQuestions";

type Answers = Record<string, string | string[]>;

export default function CoachQuestionnaire({
  onComplete,
  onCancel,
}: {
  onComplete: (answers: Answers) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const question = ONBOARDING_QUESTIONS[step];
  const isLast = step === ONBOARDING_QUESTIONS.length - 1;
  const value = answers[question.id];

  function setAnswer(v: string | string[]) {
    setAnswers((a) => ({ ...a, [question.id]: v }));
  }

  function toggleMulti(option: string) {
    const current = Array.isArray(value) ? value : [];
    setAnswer(current.includes(option) ? current.filter((o) => o !== option) : [...current, option]);
  }

  function goNext() {
    if (isLast) {
      onComplete(answers);
      return;
    }
    setStep((s) => s + 1);
  }

  function goBack() {
    if (step === 0) return;
    setStep((s) => s - 1);
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-1.5 mb-8">
          {ONBOARDING_QUESTIONS.map((q, i) => (
            <div
              key={q.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-base-panel2"}`}
            />
          ))}
        </div>

        <motion.div key={question.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
            <div className="text-xs text-base-muted mb-2">
              Question {step + 1} of {ONBOARDING_QUESTIONS.length}
            </div>
            <h2 className="text-xl font-semibold mb-1">{question.prompt}</h2>
            {question.helper && <p className="text-sm text-base-muted mb-4">{question.helper}</p>}

            <div className="mt-5">
              {question.type === "single" && (
                <div className="flex flex-col gap-2">
                  {question.options!.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswer(opt)}
                      className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                        value === opt
                          ? "border-accent bg-brand-gradient-soft shadow-glow text-base-text"
                          : "border-base-border bg-base-panel2 hover:border-accent/50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {question.type === "multi" && (
                <div className="flex flex-wrap gap-2">
                  {question.options!.map((opt) => {
                    const selected = Array.isArray(value) && value.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleMulti(opt)}
                        className={`px-4 py-2.5 rounded-full border text-sm transition-all ${
                          selected
                            ? "border-accent bg-brand-gradient-soft shadow-glow text-base-text"
                            : "border-base-border bg-base-panel2 hover:border-accent/50"
                        }`}
                      >
                        {selected ? "✓ " : ""}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {question.type === "short" && (
                <input
                  autoFocus
                  value={(value as string) || ""}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={question.helper}
                  className="w-full bg-base-panel2 border border-base-border rounded-lg px-4 py-3 text-sm focus:border-accent focus:shadow-glow outline-none transition-all"
                />
              )}

              {question.type === "long" && (
                <textarea
                  autoFocus
                  value={(value as string) || ""}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                  placeholder="Type your answer..."
                  className="w-full bg-base-panel2 border border-base-border rounded-lg px-4 py-3 text-sm focus:border-accent focus:shadow-glow outline-none transition-all resize-y"
                />
              )}
            </div>
        </motion.div>

        <div className="flex items-center justify-between mt-8">
          <button
            onClick={step === 0 ? onCancel : goBack}
            className="text-sm text-base-muted hover:text-base-text transition-colors"
          >
            {step === 0 ? "Cancel" : "← Back"}
          </button>
          <button
            onClick={goNext}
            className="bg-brand-gradient text-white font-medium rounded-lg px-6 py-2.5 text-sm shadow-glow hover:brightness-110 transition-all"
          >
            {isLast ? "Finish" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
