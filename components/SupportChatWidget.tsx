"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";
import MarkdownMessage from "./MarkdownMessage";

type Msg = { role: "user" | "assistant"; content: string };

export default function SupportChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (pathname?.startsWith("/coach")) return null;

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const nextMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setSending(true);
    try {
      const res = await fetch("/api/public/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [...m, { role: "assistant", content: data.error || "Something went wrong." }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Could not reach the server." }]);
    }
    setSending(false);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="mb-3 w-80 sm:w-96 h-[28rem] glass-panel border border-base-border rounded-2xl shadow-card flex flex-col overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-base-border flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-base-panel2 flex items-center justify-center shrink-0">
                <Logo className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Ask about OpticTrader</div>
                <div className="text-xs text-base-muted">Usually replies in seconds</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
              {messages.length === 0 && (
                <p className="text-sm text-base-muted">Ask about pricing, features, or how the trial works.</p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-xl px-3 py-2 ${
                    m.role === "user" ? "bg-brand-gradient text-white ml-auto text-sm whitespace-pre-wrap" : "bg-base-panel2"
                  }`}
                >
                  {m.role === "user" ? m.content : <MarkdownMessage content={m.content} />}
                </div>
              ))}
              {sending && <div className="text-xs text-base-muted">Typing...</div>}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t border-base-border flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask a question..."
                className="flex-1 bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm focus:border-accent outline-none transition-all"
              />
              <button
                onClick={send}
                disabled={sending}
                className="bg-brand-gradient text-white rounded-lg px-3 py-2 text-sm shadow-glow hover:brightness-110 transition-all disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 rounded-full bg-brand-gradient shadow-glow flex items-center justify-center text-xl hover:brightness-110 transition-all"
        aria-label="Open chat"
      >
        {open ? "✕" : "💬"}
      </motion.button>
    </div>
  );
}
