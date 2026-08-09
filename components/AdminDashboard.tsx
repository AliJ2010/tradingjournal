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
};

type CreatorCode = {
  id: string;
  code: string;
  commissionPercent: number;
  creator: { username: string; displayName: string };
  _count: { referrals: number };
};

type SupportMessage = { id: string; name: string; email: string; message: string; createdAt: string };

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [creatorCodes, setCreatorCodes] = useState<CreatorCode[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCode, setNewCode] = useState("");
  const [newPercentOff, setNewPercentOff] = useState("");
  const [codeError, setCodeError] = useState("");

  const [creatorUsername, setCreatorUsername] = useState("");
  const [creatorCodeInput, setCreatorCodeInput] = useState("");
  const [creatorCommission, setCreatorCommission] = useState("20");
  const [creatorError, setCreatorError] = useState("");

  async function loadAll() {
    const [u, d, c, s] = await Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/discount-codes").then((r) => r.json()),
      fetch("/api/admin/creator-codes").then((r) => r.json()),
      fetch("/api/admin/support").then((r) => r.json()),
    ]);
    setUsers(u);
    setDiscountCodes(d);
    setCreatorCodes(c);
    setSupportMessages(s);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createDiscountCode(e: React.FormEvent) {
    e.preventDefault();
    setCodeError("");
    const res = await fetch("/api/admin/discount-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: newCode, percentOff: newPercentOff || undefined }),
    });
    const data = await res.json();
    if (!res.ok) setCodeError(data.error);
    else {
      setNewCode("");
      setNewPercentOff("");
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

  async function createCreatorCode(e: React.FormEvent) {
    e.preventDefault();
    setCreatorError("");
    const res = await fetch("/api/admin/creator-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: creatorUsername, code: creatorCodeInput, commissionPercent: creatorCommission }),
    });
    const data = await res.json();
    if (!res.ok) setCreatorError(data.error);
    else {
      setCreatorUsername("");
      setCreatorCodeInput("");
      loadAll();
    }
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
                        className="bg-base-panel2 border border-base-border rounded-md px-2 py-1 text-xs"
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
          <h2 className="text-sm font-semibold mb-4">Discount codes</h2>
          <form onSubmit={createDiscountCode} className="flex gap-2 mb-4">
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
            <button className="bg-brand-gradient text-white rounded-lg px-3 py-2 text-sm shadow-glow hover:brightness-110 transition-all">Add</button>
          </form>
          {codeError && <p className="text-xs text-pill-red-bg mb-2">{codeError}</p>}
          <div className="space-y-1.5">
            {discountCodes.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg hover:bg-base-panel2/50">
                <span className="font-mono">{c.code}</span>
                <span className="text-base-muted text-xs">{c.percentOff ? `${c.percentOff}% off` : c.amountOffCents ? `$${(c.amountOffCents / 100).toFixed(2)} off` : "—"}</span>
                <span className="text-base-muted text-xs">{c.timesRedeemed} used</span>
                <button
                  onClick={() => toggleCode(c.id, !c.active)}
                  className={`text-xs px-2 py-1 rounded-md ${c.active ? "bg-pill-green-bg/20 text-pill-green-bg" : "bg-base-panel2 text-base-muted"}`}
                >
                  {c.active ? "Active" : "Disabled"}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-base-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold mb-4">Content creator codes</h2>
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
              <input
                value={creatorCommission}
                onChange={(e) => setCreatorCommission(e.target.value)}
                placeholder="%"
                className="w-16 bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button className="w-full bg-brand-gradient text-white rounded-lg px-3 py-2 text-sm shadow-glow hover:brightness-110 transition-all">
              Create creator code
            </button>
          </form>
          {creatorError && <p className="text-xs text-pill-red-bg mb-2">{creatorError}</p>}
          <div className="space-y-1.5">
            {creatorCodes.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg hover:bg-base-panel2/50">
                <span className="font-mono">{c.code}</span>
                <span className="text-base-muted text-xs">{c.creator.displayName}</span>
                <span className="text-base-muted text-xs">{c.commissionPercent}%</span>
                <span className="text-base-muted text-xs">{c._count.referrals} referrals</span>
              </div>
            ))}
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
