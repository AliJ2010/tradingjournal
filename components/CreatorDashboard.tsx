"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type PlanRule = {
  id: string;
  planKey: string;
  discountType: string;
  discountValue: number;
  commissionType: string;
  commissionValue: number;
  commissionDuration: string;
  active: boolean;
};

type Referral = { id: string; createdAt: string; referredUser: { displayName: string; createdAt: string; plan: string } };

type CreatorCode = {
  id: string;
  code: string;
  commissionPercent: number;
  active: boolean;
  whopAffiliateCode: string | null;
  referrals: Referral[];
  planRules: PlanRule[];
} | null;

type Sale = { customer: string; plan: string; purchaseDate: string; amountPaid: number; commission: number; status: string };

export default function CreatorDashboard() {
  const [creatorCode, setCreatorCode] = useState<CreatorCode>(null);
  const [stats, setStats] = useState<{ signups: number; paidCustomers: number; conversionRate: number; totalRevenueReferred: number; totalCommission: number } | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/creator/me")
      .then((r) => r.json())
      .then((data) => {
        setCreatorCode(data.creatorCode);
        setStats(data.stats || null);
        setSales(data.sales || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-base-muted text-sm">Loading...</div>;

  if (!creatorCode) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">🎬 Creator</h1>
        <p className="text-sm text-base-muted">No creator code has been assigned to your account yet — ask an admin to set one up.</p>
      </div>
    );
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/?ref=${creatorCode.code}` : "";
  const monthlyRule = creatorCode.planRules.find((r) => r.planKey === "monthly");
  const lifetimeRule = creatorCode.planRules.find((r) => r.planKey === "lifetime");

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
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
        <div className="flex gap-4 mt-3 text-xs text-base-muted">
          {monthlyRule && (
            <span>
              Monthly: {monthlyRule.discountValue}% off, {monthlyRule.commissionValue}% commission ({monthlyRule.commissionDuration === "all_payments" ? "recurring" : "first payment"})
            </span>
          )}
          {lifetimeRule && (
            <span>
              Lifetime: {lifetimeRule.discountValue}% off, {lifetimeRule.commissionValue}% commission
            </span>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel border border-base-border rounded-2xl p-5">
          <div className="text-xs text-base-muted mb-1">Signups</div>
          <div className="text-2xl font-semibold">{stats?.signups ?? 0}</div>
        </div>
        <div className="glass-panel border border-base-border rounded-2xl p-5">
          <div className="text-xs text-base-muted mb-1">Paid customers</div>
          <div className="text-2xl font-semibold">{stats?.paidCustomers ?? 0}</div>
        </div>
        <div className="glass-panel border border-base-border rounded-2xl p-5">
          <div className="text-xs text-base-muted mb-1">Conversion rate</div>
          <div className="text-2xl font-semibold">{(stats?.conversionRate ?? 0).toFixed(0)}%</div>
        </div>
        <div className="glass-panel border border-base-border rounded-2xl p-5">
          <div className="text-xs text-base-muted mb-1">Revenue referred</div>
          <div className="text-2xl font-semibold">${(stats?.totalRevenueReferred ?? 0).toFixed(0)}</div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-accent/30 rounded-2xl p-5">
        <div className="text-xs text-base-muted mb-1">Estimated commission (Whop pays this out directly)</div>
        <div className="text-2xl font-semibold text-accent">${(stats?.totalCommission ?? 0).toFixed(2)}</div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-base-border rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-3">Sales</h2>
        {sales.length === 0 && <p className="text-sm text-base-muted">No sales yet.</p>}
        {sales.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-base-muted border-b border-base-border">
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4 text-right">Paid</th>
                  <th className="py-2 pr-4 text-right">Commission</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => (
                  <tr key={i} className="border-b border-base-border/60 last:border-b-0">
                    <td className="py-2 pr-4">{s.customer}</td>
                    <td className="py-2 pr-4 text-base-muted capitalize">{s.plan}</td>
                    <td className="py-2 pr-4 text-base-muted">{new Date(s.purchaseDate).toLocaleDateString()}</td>
                    <td className="py-2 pr-4 text-right">${s.amountPaid.toFixed(2)}</td>
                    <td className="py-2 pr-4 text-right text-accent">${s.commission.toFixed(2)}</td>
                    <td className="py-2 text-right text-base-muted capitalize">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

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
