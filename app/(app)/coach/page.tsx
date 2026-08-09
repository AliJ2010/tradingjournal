"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MarkdownMessage from "@/components/MarkdownMessage";

type Msg = { id: string; role: string; content: string; imageUrl?: string | null; createdAt: string };

export default function CoachPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState("");
  const [attachedImage, setAttachedImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number | null } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/coach")
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.messages || []);
        setConfigured(data.configured);
        setUsage({ used: data.usedThisMonth ?? 0, limit: data.limit });
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function uploadImage(file: File) {
    setError("");
    const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PNG, JPEG, WEBP, or GIF images are allowed.");
      return;
    }
    const MAX_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("Image is too large (max 4MB).");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      setAttachedImage(dataUrl);
    } catch {
      setError("Couldn't read that image.");
    }
    setUploading(false);
  }

  async function send() {
    const text = input.trim();
    if ((!text && !attachedImage) || sending) return;
    setError("");
    setInput("");
    const imageUrl = attachedImage;
    setAttachedImage("");
    setMessages((m) => [
      ...m,
      { id: `tmp-${Date.now()}`, role: "user", content: text || "(sent an image)", imageUrl, createdAt: new Date().toISOString() },
    ]);
    setSending(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text || "Take a look at this chart.", imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setMessages((m) => [...m, data.reply]);
        setUsage({ used: data.usedThisMonth, limit: data.limit });
      }
    } catch {
      setError("Could not reach the coach.");
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="p-6 border-b border-base-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">🧠 AI Coach</h1>
          <p className="text-sm text-base-muted mt-1">Personalized feedback based on your logged trades.</p>
        </div>
        {usage && (
          <span className="text-xs text-base-muted shrink-0">
            {usage.limit === null ? "Unlimited messages" : `${usage.used}/${usage.limit} messages this month`}
          </span>
        )}
      </div>

      {!configured && (
        <div className="m-6 bg-pill-orange-bg/10 border border-pill-orange-bg/40 rounded-xl p-4 text-sm">
          The AI Coach isn't configured yet — an admin needs to set an Anthropic API key for the server.
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-base-muted">
            Ask something like "What's my biggest weakness right now?" or attach a chart screenshot for feedback.
          </p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-2xl rounded-2xl px-4 py-3 ${
                m.role === "user" ? "bg-brand-gradient text-white shadow-glow ml-auto" : "glass-panel border border-base-border"
              }`}
            >
              {m.imageUrl && (
                <img src={m.imageUrl} alt="Attached chart" className="max-h-64 rounded-lg mb-2 border border-white/10" />
              )}
              {m.role === "user" ? (
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              ) : (
                <MarkdownMessage content={m.content} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {sending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-base-muted">
            Coach is thinking...
          </motion.div>
        )}
        {error && <div className="text-sm text-pill-red-bg">{error}</div>}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-base-border">
        {attachedImage && (
          <div className="mb-2 flex items-center gap-2">
            <img src={attachedImage} alt="Attached" className="h-14 rounded-lg border border-base-border" />
            <button onClick={() => setAttachedImage("")} className="text-xs text-pill-red-bg hover:underline">
              Remove
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!configured || uploading}
            title="Attach a chart screenshot"
            className="shrink-0 bg-base-panel2 border border-base-border rounded-lg px-3 py-2.5 text-sm hover:bg-base-panel disabled:opacity-50"
          >
            {uploading ? "..." : "🖼️"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={!configured}
            placeholder={configured ? "Ask your coach..." : "Add an API key to chat"}
            className="flex-1 bg-base-panel2 border border-base-border rounded-lg px-4 py-2.5 text-sm focus:border-accent focus:shadow-glow outline-none transition-all disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={!configured || sending}
            className="bg-brand-gradient text-white font-medium rounded-lg px-4 py-2.5 text-sm shadow-glow hover:brightness-110 transition-all disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
