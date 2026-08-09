"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const FAQS = [
  { q: "How does the free trial work?", a: "Every account gets 5 days of full access — journal, calendar, dashboard, AI Coach, and Friends. No card required." },
  { q: "What happens when my trial ends?", a: "Billing isn't live yet, so nothing is locked — you'll just see a banner pointing you to the Pricing page for when it launches." },
  { q: "Can I export my data?", a: "Yes — head to the Journal page and use the Export button to download your trades as CSV or PDF." },
  { q: "Is my data private?", a: "Yes. Only you can see your full journal. If you add a friend, any field you mark hidden stays hidden from them." },
  { q: "What instruments does OpticTrader support?", a: "Any — set yours on the Settings page and the AI Coach and news calendar will use it." },
];

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong.");
      else {
        setStatus("Message sent — we'll get back to you soon.");
        setName("");
        setEmail("");
        setMessage("");
      }
    } catch {
      setError("Could not send your message.");
    }
    setSending(false);
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Support</h1>
      <p className="text-sm text-base-muted mb-8">Answers to common questions, or reach out directly below.</p>

      <div className="glass-panel border border-base-border rounded-2xl divide-y divide-base-border/60 mb-8">
        {FAQS.map((faq, i) => (
          <div key={faq.q}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full text-left px-5 py-4 flex items-center justify-between text-sm font-medium"
            >
              {faq.q}
              <span className="text-base-muted">{openFaq === i ? "−" : "+"}</span>
            </button>
            {openFaq === i && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-4 text-sm text-base-muted">
                {faq.a}
              </motion.div>
            )}
          </div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-base-border rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-4">Contact us</h2>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="bg-base-panel2 border border-base-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:shadow-glow outline-none transition-all"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="bg-base-panel2 border border-base-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:shadow-glow outline-none transition-all"
              required
            />
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How can we help?"
            rows={4}
            className="w-full bg-base-panel2 border border-base-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:shadow-glow outline-none transition-all resize-y"
            required
          />
          {error && <p className="text-sm text-pill-red-bg">{error}</p>}
          {status && <p className="text-sm text-pill-green-bg">{status}</p>}
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={sending}
            className="bg-brand-gradient text-white font-medium rounded-lg px-4 py-2.5 text-sm shadow-glow hover:brightness-110 transition-all disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send message"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
