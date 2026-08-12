"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getPlanStatus } from "@/lib/plan";

type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  plan: string;
  trialEndsAt: string | null;
  referredByCode: string | null;
  createdAt: string;
  _count: { trades: number };
};

type DiscountCode = {
  id: string;
  code: string;
  percentOff: number | null;
  amountOffCents: number | null;
  active: boolean;
  maxRedemptions: number | null;
  timesRedeemed: number;
  endsAt: string | null;
  whopPromoCodeId: string | null;
};

type PlanRule = {
  id: string;
  planKey: string;
  discountValue: number;
  commissionValue: number;
  commissionDuration: string;
  whopPromoCodeId: string | null;
};

type CreatorCode = {
  id: string;
  code: string;
  commissionPercent: number;
  active: boolean;
  whopAffiliateId: string | null;
  whopAffiliateCode: string | null;
  creator: { username: string; displayName: string };
  _count: { referrals: number };
  planRules: PlanRule[];
};

type SupportMessage = { id: string; name: string; email: string; message: string; createdAt: string };

export default function AdminDashboard({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [creatorCodes, setCreatorCodes] = useState<CreatorCode[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expandedCreator, setExpandedCreator] = useState<string | null>(null);

  const [newCode, setNewCode] = useState("");
  const [newPercentOff, setNewPercentOff] = useState("25");
  const [newEndsAt, setNewEndsAt] = useState("");
  const [codeError, setCodeError] = useState("");

  const [creatorUsername, setCreatorUsername] = useState("");
  const [creatorCodeInput, setCreatorCodeInput] = useState("");
  const [creatorDiscount, setCreatorDiscount] = useState("25");
  const [creatorCommission, setCreatorCommission] = useState("20");
  const [creatorError, setCreatorError] = useState("");

  async function loadAll() {
    const [u, d, c, s] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/discount-codes"),
      fetch("/api/admin/creator-codes"),
      fetch("/api/admin/support"),
    ]);
    if (!u.ok || !d.ok || !c.ok || !s.ok) {
      setLoadError("Couldn't load the admin dashboard — try refreshing.");
      setLoading(false);
      return;
    }
    setLoadError("");
    setUsers(await u.json());
    setDiscountCodes(await d.json());
    setCreatorCodes(await c.json());
    setSupportMessages(await s.json());
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function oneMonthFromNow() {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }

  async function createDiscountCode(e: React.FormEvent) {
    e.preventDefault();
    setCodeError("");
    const res = await fetch("/api/admin/discount-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: newCode, percentOff: newPercentOff || undefined, endsAt: newEndsAt || undefined }),
    });
    const data = await res.json();
    if (!res.ok) setCodeError(data.error);
    else {
      setNewCode("");
      setNewEndsAt("");
      loadAll();
    }
  }

  async function toggleCode(id: string, active: boolean) {
    await fetch(`/api/admin/discount-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    loadAll();
  }

  async function deleteDiscountCode(id: string, code: string) {
    if (!confirm(`Permanently delete the discount code "${code}"? This can't be undone.`)) return;
    await fetch(`/api/admin/discount-codes/${id}`, { method: "DELETE" });
    loadAll();
  }

  async function editDiscountCode(id: string, percentOff: string) {
    setCodeError("");
    const res = await fetch(`/api/admin/discount-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ percentOff: Number(percentOff) }),
    });
    const data = await res.json();
    if (!res.ok) setCodeError(data.error);
    loadAll();
  }

  async function deleteCreator(id: string, code: string) {
    if (!confirm(`Permanently delete the creator code "${code}"? This removes their referral history too. This can't be undone.`)) return;
    await fetch(`/api/admin/creator-codes/${id}`, { method: "DELETE" });
    loadAll();
  }

  async function createWhopPromoForDiscountCode(id: string) {
    const res = await fetch(`/api/admin/discount-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ createWhopPromoCode: true }),
    });
    const data = await res.json();
    if (!res.ok) setCodeError(data.error);
    loadAll();
  }

  async function createCreatorCode(e: React.FormEvent) {
    e.preventDefault();
    setCreatorError("");
    const res = await fetch("/api/admin/creator-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: creatorUsername,
        code: creatorCodeInput,
        commissionPercent: creatorCommission,
        discountPercent: creatorDiscount,
      }),
    });
    const data = await res.json();
    if (!res.ok) setCreatorError(data.error);
    else {
      setCreatorUsername("");
      setCreatorCodeInput("");
      loadAll();
    }
  }

  async function updateCreator(id: string, patch: Record<string, any>) {
    await fetch(`/api/admin/creator-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    loadAll();
  }

  async function saveRule(
    creatorId: string,
    planKey: "monthly" | "lifetime",
    discountValue: string,
    commissionValue: string,
    commissionDuration: string,
    createPromo: boolean
  ) {
    setCreatorError("");
    const res = await fetch(`/api/admin/creator-codes/${creatorId}/plan-rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planKey,
        discountValue: Number(discountValue),
        commissionValue: Number(commissionValue),
        commissionDuration,
        createWhopPromoCode: createPromo,
      }),
    });
    const data = await res.json();
    if (!res.ok) setCreatorError(data.error);
    loadAll();
  }

  async function setUserRole(id: string, role: string) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    loadAll();
  }

  async function setUserPlan(id: string, plan: string) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    loadAll();
  }

  if (loading) return <div className="p-8 text-base-muted text-sm">Loading admin dashboard...</div>;
  if (loadError) return <div className="p-8 text-pill-red-bg text-sm">{loadError}</div>;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-1">🛠️ Admin</h1>
        <p className="text-sm text-base-muted">{users.length} users, {creatorCodes.length} creator codes, {discountCodes.length} discount codes.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-base-border rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-4">Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-base-muted border-b border-base-border">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Trades</th>
                <th className="py-2 pr-4">Referred by</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const status = getPlanStatus({ plan: u.plan, trialEndsAt: u.trialEndsAt });
                return (
                  <tr key={u.id} className="border-b border-base-border/60">
                    <td className="py-2 pr-4">{u.displayName} <span className="text-base-muted">@{u.username}</span></td>
                    <td className="py-2 pr-4 text-base-muted">{u.email}</td>
                    <td className="py-2 pr-4">
                      <select
                        value={u.plan}
                        onChange={(e) => setUserPlan(u.id, e.target.value)}
                        className="bg-base-panel2 border border-base-border rounded-md px-2 py-1 text-xs"
                      >
                        <option value="trial">Trial ({status.isExpired ? "expired" : `${status.daysLeft ?? "?"}d left`})</option>
                        <option value="monthly">Monthly</option>
                        <option value="lifetime">Lifetime</option>
                        <option value="expired">Expired</option>
                      </select>
                    </td>
                    <td className="py-2 pr-4">{u._count.trades}</td>
                    <td className="py-2 pr-4 text-base-muted">{u.referredByCode || "—"}</td>
                    <td className="py-2 pr-4">
                      <select
                        value={u.role}
                        onChange={(e) => setUserRole(u.id, e.target.value)}
                        disabled={u.id === currentUserId}
                        title={u.id === currentUserId ? "You can't change your own role — have another admin do it." : undefined}
                        className="bg-base-panel2 border border-base-border rounded-md px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="user">User</option>
                        <option value="creator">Creator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-2 pr-4 text-base-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-base-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold mb-1">Discount codes</h2>
          <p className="text-xs text-base-muted mb-4">General codes (e.g. the launch promo). No affiliate commission is ever attached to these.</p>
          <form onSubmit={createDiscountCode} className="space-y-2 mb-4">
            <div className="flex gap-2">
              <input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="CODE"
                className="flex-1 bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm"
              />
              <input
                value={newPercentOff}
                onChange={(e) => setNewPercentOff(e.target.value)}
                placeholder="% off"
                className="w-20 bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={newEndsAt}
                onChange={(e) => setNewEndsAt(e.target.value)}
                className="flex-1 bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setNewEndsAt(oneMonthFromNow())}
                className="text-xs text-accent hover:underline whitespace-nowrap"
              >
                +1 month
              </button>
            </div>
            <button className="w-full bg-brand-gradient text-white rounded-lg px-3 py-2 text-sm shadow-glow hover:brightness-110 transition-all">Add</button>
          </form>
          {codeError && <p className="text-xs text-pill-red-bg mb-2">{codeError}</p>}
          <div className="space-y-1.5">
            {discountCodes.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg hover:bg-base-panel2/50">
                <span className="font-mono">{c.code}</span>
                {c.whopPromoCodeId ? (
                  <span className="text-base-muted text-xs">{c.percentOff ? `${c.percentOff}% off` : c.amountOffCents ? `$${(c.amountOffCents / 100).toFixed(2)} off` : "—"}</span>
                ) : (
                  <input
                    type="number"
                    defaultValue={c.percentOff ?? ""}
                    onBlur={(e) => e.target.value && editDiscountCode(c.id, e.target.value)}
                    title="% off — editable until linked to a real Whop promo code"
                    className="w-14 bg-base-panel2 border border-base-border rounded-md px-1.5 py-0.5 text-xs text-center"
                  />
                )}
                <span className="text-base-muted text-xs">{c.endsAt ? `ends ${new Date(c.endsAt).toLocaleDateString()}` : "no end date"}</span>
                {c.whopPromoCodeId ? (
                  <span className="text-xs text-pill-green-bg">Whop-linked</span>
                ) : (
                  <button onClick={() => createWhopPromoForDiscountCode(c.id)} className="text-xs text-accent hover:underline">
                    Not in Whop — fix
                  </button>
                )}
                <button
                  onClick={() => toggleCode(c.id, !c.active)}
                  className={`text-xs px-2 py-1 rounded-md ${c.active ? "bg-pill-green-bg/20 text-pill-green-bg" : "bg-base-panel2 text-base-muted"}`}
                >
                  {c.active ? "Active" : "Disabled"}
                </button>
                <button onClick={() => deleteDiscountCode(c.id, c.code)} className="text-xs text-pill-red-bg hover:underline" title="Delete permanently">
                  Delete
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-base-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold mb-1">Creators / Affiliates</h2>
          <p className="text-xs text-base-muted mb-4">One code discounts the customer AND attributes the affiliate sale.</p>
          <form onSubmit={createCreatorCode} className="space-y-2 mb-4">
            <div className="flex gap-2">
              <input
                value={creatorUsername}
                onChange={(e) => setCreatorUsername(e.target.value)}
                placeholder="Username"
                className="flex-1 bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm"
              />
              <input
                value={creatorCodeInput}
                onChange={(e) => setCreatorCodeInput(e.target.value)}
                placeholder="CODE"
                className="flex-1 bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <input
                value={creatorDiscount}
                onChange={(e) => setCreatorDiscount(e.target.value)}
                placeholder="Customer discount %"
                className="flex-1 bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm"
              />
              <input
                value={creatorCommission}
                onChange={(e) => setCreatorCommission(e.target.value)}
                placeholder="Commission %"
                className="flex-1 bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button className="w-full bg-brand-gradient text-white rounded-lg px-3 py-2 text-sm shadow-glow hover:brightness-110 transition-all">
              Create creator code (Monthly rule)
            </button>
          </form>
          {creatorError && <p className="text-xs text-pill-red-bg mb-2">{creatorError}</p>}
          <div className="space-y-1.5">
            {creatorCodes.map((c) => {
              const isExpanded = expandedCreator === c.id;
              const monthlyRule = c.planRules.find((r) => r.planKey === "monthly");
              const lifetimeRule = c.planRules.find((r) => r.planKey === "lifetime");
              return (
                <div key={c.id} className="rounded-lg hover:bg-base-panel2/50">
                  <div
                    onClick={() => setExpandedCreator(isExpanded ? null : c.id)}
                    className="flex items-center justify-between text-sm px-2 py-1.5 cursor-pointer"
                  >
                    <span className="font-mono">{c.code}</span>
                    <span className="text-base-muted text-xs">{c.creator.displayName}</span>
                    <span className="text-base-muted text-xs">{c._count.referrals} referrals</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${c.active ? "text-pill-green-bg" : "text-base-muted"}`}>
                      {c.active ? "Active" : "Disabled"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCreator(c.id, c.code);
                      }}
                      className="text-xs text-pill-red-bg hover:underline"
                      title="Delete permanently"
                    >
                      Delete
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3 text-xs">
                      <div>
                        <div className="text-base-muted mb-1">Monthly</div>
                        <PlanRuleEditor
                          rule={monthlyRule}
                          onSave={(d, comm, dur, createPromo) => saveRule(c.id, "monthly", d, comm, dur, createPromo)}
                        />
                      </div>
                      <div>
                        <div className="text-base-muted mb-1">Lifetime</div>
                        <PlanRuleEditor
                          rule={lifetimeRule}
                          onSave={(d, comm, dur, createPromo) => saveRule(c.id, "lifetime", d, comm, dur, createPromo)}
                        />
                      </div>
                      <div className="flex gap-2 items-center pt-2">
                        <input
                          defaultValue={c.whopAffiliateCode || ""}
                          onBlur={(e) => updateCreator(c.id, { whopAffiliateCode: e.target.value })}
                          placeholder="Whop affiliate code"
                          className="flex-1 bg-base-panel2 border border-base-border rounded-md px-2 py-1"
                        />
                        <input
                          defaultValue={c.whopAffiliateId || ""}
                          onBlur={(e) => updateCreator(c.id, { whopAffiliateId: e.target.value })}
                          placeholder="Whop affiliate ID"
                          className="flex-1 bg-base-panel2 border border-base-border rounded-md px-2 py-1"
                        />
                      </div>
                      <button
                        onClick={() => updateCreator(c.id, { active: !c.active })}
                        className={`text-xs px-2 py-1 rounded-md ${c.active ? "bg-pill-red-bg/20 text-pill-red-bg" : "bg-pill-green-bg/20 text-pill-green-bg"}`}
                      >
                        {c.active ? "Disable creator" : "Enable creator"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-base-border rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-4">Support messages</h2>
        {supportMessages.length === 0 && <p className="text-sm text-base-muted">No messages yet.</p>}
        <div className="space-y-3">
          {supportMessages.map((m) => (
            <div key={m.id} className="border border-base-border rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{m.name} <span className="text-base-muted">({m.email})</span></span>
                <span className="text-xs text-base-muted">{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-base-muted">{m.message}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Handles both creating a new plan rule and editing an existing one. Commission
// fields are always editable (purely informational — the real payout comes from
// a separate Whop Affiliate Override). Discount is locked once a real Whop promo
// code exists, since Whop doesn't support changing a promo's amount after creation.
function PlanRuleEditor({
  rule,
  onSave,
}: {
  rule?: { discountValue: number; commissionValue: number; commissionDuration: string; whopPromoCodeId: string | null };
  onSave: (discount: string, commission: string, duration: string, createPromo: boolean) => void;
}) {
  const [discount, setDiscount] = useState(String(rule?.discountValue ?? 25));
  const [commission, setCommission] = useState(String(rule?.commissionValue ?? 20));
  const [duration, setDuration] = useState(rule?.commissionDuration ?? "all_payments");
  const hasPromo = Boolean(rule?.whopPromoCodeId);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input
        value={discount}
        onChange={(e) => setDiscount(e.target.value)}
        disabled={hasPromo}
        title={hasPromo ? "Locked — a real Whop promo code already uses this amount" : "% off"}
        placeholder="% off"
        className="w-16 bg-base-panel2 border border-base-border rounded-md px-2 py-1 disabled:opacity-50"
      />
      <input
        value={commission}
        onChange={(e) => setCommission(e.target.value)}
        placeholder="% comm"
        className="w-16 bg-base-panel2 border border-base-border rounded-md px-2 py-1"
      />
      <select value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-base-panel2 border border-base-border rounded-md px-2 py-1">
        <option value="all_payments">Recurring</option>
        <option value="first_payment">First payment only</option>
      </select>
      <button onClick={() => onSave(discount, commission, duration, false)} className="text-accent hover:underline">
        Save
      </button>
      {!hasPromo && (
        <button onClick={() => onSave(discount, commission, duration, true)} className="text-accent hover:underline">
          Save + create Whop promo
        </button>
      )}
      {hasPromo && <span className="text-pill-green-bg">Whop promo linked</span>}
    </div>
  );
}
