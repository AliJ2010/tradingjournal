"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Referral = { id: string; createdAt: string; referredUser: { displayName: string; createdAt: string; plan: string } };
type CreatorCode = { id: string; code: string; commissionPercent: number; referrals: Referral[] } | null;

export default function CreatorDashboard() {
  const [creatorCode, setCreatorCode] = useState<CreatorCode>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/creator/me")
      .then((r) => r.json())
      .then((data) => setCreatorCode(data.creatorCode))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-base-muted text-sm">Loading...</div>;

  if (!creatorCode) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">🎬 Creator</h1>
        <p className="text-sm text-base-muted">No creator code has been assigned to your account yet — ask an admin to set one up.</p>
      </div>
    );
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/register?ref=${creatorCode.code}` : "";
  const activePaidCount = creatorCode.referrals.filter((r) => r.referredUser.plan === "monthly" || r.referredUser.plan === "lifetime").length;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">🎬 Creator dashboard</h1>
        <p className="text-sm text-base-muted">Your referral code and how it's performing.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-accent/40 rounded-2xl p-6 shadow-glow">
        <div className="text-xs text-base-muted mb-1">Your code</div>
        <div className="text-3xl font-mono font-semibold mb-3">{creatorCode.code}</div>
        <div className="flex gap-2">
          <input readOnly value={shareUrl} className="flex-1 bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm" />
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="bg-brand-gradient text-white rounded-lg px-4 py-2 text-sm shadow-glow hover:brightness-110 transition-all"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel border border-base-border rounded-2xl p-5">
          <div className="text-xs text-base-muted mb-1">Signups</div>
          <div className="text-2xl font-semibold">{creatorCode.referrals.length}</div>
        </div>
        <div className="glass-panel border border-base-border rounded-2xl p-5">
          <div className="text-xs text-base-muted mb-1">Paying customers</div>
          <div className="text-2xl font-semibold">{activePaidCount}</div>
        </div>
        <div className="glass-panel border border-base-border rounded-2xl p-5">
          <div className="text-xs text-base-muted mb-1">Your commission</div>
          <div className="text-2xl font-semibold text-accent">{creatorCode.commissionPercent}%</div>
        </div>
      </div>

      <p className="text-xs text-base-muted">Earnings tracking will show real $ once billing goes live — for now this tracks signup attribution only.</p>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-base-border rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-3">Referrals</h2>
        {creatorCode.referrals.length === 0 && <p className="text-sm text-base-muted">No signups yet — share your link above.</p>}
        <div className="space-y-1.5">
          {creatorCode.referrals.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg hover:bg-base-panel2/50">
              <span>{r.referredUser.displayName}</span>
              <span className="text-base-muted text-xs">{r.referredUser.plan}</span>
              <span className="text-base-muted text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
