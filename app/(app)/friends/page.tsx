"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import TradeForm, { type TradeDraft } from "@/components/TradeForm";
import PillBadge from "@/components/PillBadge";
import { parseTags } from "@/lib/json";
import { toDayKey } from "@/lib/streak";
import { formatMoney } from "@/lib/pnl";

type FriendLink = {
  id: string;
  status: string;
  direction: "incoming" | "outgoing";
  friend: { id: string; username: string; displayName: string };
};

type Reaction = { count: number; reactedByMe: boolean };

function tradeToDraft(t: any): TradeDraft {
  return {
    id: t.id,
    date: t.date ? new Date(t.date).toISOString().slice(0, 10) : "",
    result: t.result,
    direction: t.direction,
    htfBias: t.htfBias,
    instrument: t.instrument,
    timeFrame: t.timeFrame,
    entryTime: t.entryTime,
    exitTime: t.exitTime,
    riskPercent: t.riskPercent,
    rulesFollowed: t.rulesFollowed,
    rr: t.rr,
    pnl: t.pnl,
    drawDirectionTags: parseTags(t.drawDirectionTags),
    setupTags: parseTags(t.setupTags),
    emotionTags: parseTags(t.emotionTags),
    newsTags: parseTags(t.newsTags),
    whatOthersDid: t.whatOthersDid,
    notes: t.notes,
    whatWouldYouDo: t.whatWouldYouDo,
    chartImageUrl: t.chartImageUrl,
    hiddenFields: parseTags(t.hiddenFields),
  };
}

export default function FriendsPage() {
  const [links, setLinks] = useState<FriendLink[]>([]);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [viewingFriend, setViewingFriend] = useState<{ id: string; displayName: string } | null>(null);
  const [friendTrades, setFriendTrades] = useState<any[]>([]);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  async function loadLinks() {
    const res = await fetch("/api/friends");
    setLinks(await res.json());
  }

  useEffect(() => {
    loadLinks();
  }, []);

  const accepted = links.filter((l) => l.status === "accepted");
  const incoming = links.filter((l) => l.status === "pending" && l.direction === "incoming");
  const outgoing = links.filter((l) => l.status === "pending" && l.direction === "outgoing");

  async function sendRequest(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", username }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setStatus(`Friend request sent to ${username}.`);
      setUsername("");
      loadLinks();
    }
  }

  async function respond(linkId: string, action: "accept" | "decline") {
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, linkId }),
    });
    loadLinks();
  }

  async function removeFriend(linkId: string) {
    if (!confirm("Remove this friend? They will no longer see your journal.")) return;
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", linkId }),
    });
    setViewingFriend(null);
    loadLinks();
  }

  async function viewFriend(friend: { id: string; displayName: string }) {
    setViewingFriend(friend);
    setSelectedTradeId(null);
    setExpandedDay(null);
    const [tradesRes, reactionsRes] = await Promise.all([
      fetch(`/api/friends/${friend.id}`),
      fetch(`/api/reactions?friendId=${friend.id}`),
    ]);
    const data = await tradesRes.json();
    if (tradesRes.ok) {
      setFriendTrades(data.trades);
      if (data.trades.length > 0) setSelectedTradeId(data.trades[0].id);
    }
    if (reactionsRes.ok) setReactions(await reactionsRes.json());
  }

  async function toggleHeart(dateKey: string) {
    if (!viewingFriend) return;
    const friendId = viewingFriend.id;
    setReactions((r) => {
      const cur = r[dateKey] || { count: 0, reactedByMe: false };
      return { ...r, [dateKey]: { count: cur.reactedByMe ? Math.max(0, cur.count - 1) : cur.count + 1, reactedByMe: !cur.reactedByMe } };
    });
    await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", toUserId: friendId, dateKey }),
    }).catch(() => {});
  }

  const groupedDays = useMemo(() => {
    const order: string[] = [];
    const map: Record<string, any[]> = {};
    for (const t of friendTrades) {
      const key = toDayKey(t.date);
      if (!map[key]) {
        map[key] = [];
        order.push(key);
      }
      map[key].push(t);
    }
    return order.map((key) => ({ key, trades: map[key] }));
  }, [friendTrades]);

  const selectedDraft = useMemo(() => {
    const t = friendTrades.find((t) => t.id === selectedTradeId);
    return t ? tradeToDraft(t) : null;
  }, [friendTrades, selectedTradeId]);

  if (viewingFriend) {
    return (
      <div className="flex flex-col md:flex-row md:h-screen">
        <div className={`${mobileDetailOpen ? "hidden" : "flex"} md:flex w-full md:w-72 shrink-0 border-r border-base-border flex-col md:h-screen`}>
          <div className="p-4 border-b border-base-border">
            <button
              onClick={() => {
                setViewingFriend(null);
                setMobileDetailOpen(false);
              }}
              className="text-sm text-accent hover:underline mb-2"
            >
              ← Back to friends
            </button>
            <div className="font-medium">{viewingFriend.displayName}'s journal</div>
            <p className="text-xs text-base-muted mt-1">Fields they've marked private are hidden.</p>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {groupedDays.length === 0 && <p className="px-3 text-sm text-base-muted">No entries yet.</p>}
            {groupedDays.map(({ key, trades: dayTrades }) => {
              const first = dayTrades[0];
              const single = dayTrades.length === 1 ? first : null;
              const reaction = reactions[key] || { count: 0, reactedByMe: false };
              const isSelected = dayTrades.some((t) => t.id === selectedTradeId);
              const isExpanded = expandedDay === key;
              return (
                <div key={key}>
                  <div
                    className={`rounded-lg transition-colors flex items-center gap-1 ${isSelected ? "bg-base-panel2" : "hover:bg-base-panel2/60"}`}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (single) {
                          setSelectedTradeId(single.id);
                          setMobileDetailOpen(true);
                        } else {
                          setExpandedDay(isExpanded ? null : key);
                        }
                      }}
                      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.click()}
                      className="flex-1 min-w-0 text-left px-3 py-2.5 cursor-pointer flex items-center justify-between gap-2"
                    >
                      <span className="text-sm">{first.date ? new Date(first.date).toLocaleDateString(undefined, { timeZone: "UTC" }) : "—"}</span>
                      {single ? (
                        single.result && (
                          <PillBadge
                            small
                            label={single.result}
                            color={single.result === "Win" ? "green" : single.result === "Loss" ? "red" : single.result === "Breakeven" ? "gold" : "slate"}
                          />
                        )
                      ) : (
                        <PillBadge small label={`${dayTrades.length} trades ${isExpanded ? "▾" : "▸"}`} color="blue" />
                      )}
                    </div>
                    <button
                      onClick={() => toggleHeart(key)}
                      title={reaction.reactedByMe ? "Un-heart this day" : "Heart this day"}
                      className={`shrink-0 flex items-center gap-1 pr-3 pl-1.5 py-2.5 transition-colors ${
                        reaction.reactedByMe ? "text-pill-red-bg" : "text-base-muted hover:text-pill-red-bg"
                      }`}
                    >
                      <Heart size={15} fill={reaction.reactedByMe ? "currentColor" : "none"} />
                      {reaction.count > 0 && <span className="text-xs">{reaction.count}</span>}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isExpanded && dayTrades.length > 1 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pl-3"
                      >
                        {dayTrades.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setSelectedTradeId(t.id);
                              setMobileDetailOpen(true);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                              selectedTradeId === t.id ? "bg-base-panel2" : "hover:bg-base-panel2/60"
                            }`}
                          >
                            <PillBadge
                              small
                              label={t.result}
                              color={t.result === "Win" ? "green" : t.result === "Loss" ? "red" : t.result === "Breakeven" ? "gold" : "slate"}
                            />
                            <span
                              className={
                                t.result === "Win"
                                  ? "text-pill-green-bg"
                                  : t.result === "Loss"
                                  ? "text-pill-red-bg"
                                  : t.result === "Breakeven"
                                  ? "text-pill-gold-bg"
                                  : "text-base-muted"
                              }
                            >
                              {t.pnl < 0 ? "-" : ""}${formatMoney(t.pnl, 2)}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
        <div className={`${mobileDetailOpen ? "flex" : "hidden"} md:flex flex-1 overflow-y-auto flex-col`}>
          <button onClick={() => setMobileDetailOpen(false)} className="md:hidden text-sm text-accent px-6 pt-4 text-left">
            ← Back to entries
          </button>
          <AnimatePresence mode="wait">{selectedDraft && <TradeForm key={selectedTradeId} initial={selectedDraft} readOnly />}</AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Friends</h1>
      <p className="text-sm text-base-muted mb-6">
        Add a friend by their username to see each other's journals and progress. Anything you mark hidden on a trade stays private.
      </p>

      <form onSubmit={sendRequest} className="flex gap-2 mb-8">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Friend's username"
          className="flex-1 bg-base-panel2 border border-base-border rounded-lg px-4 py-2.5 text-sm focus:border-accent focus:shadow-glow outline-none transition-all"
        />
        <button type="submit" className="bg-brand-gradient text-white font-medium rounded-lg px-4 py-2.5 text-sm shadow-glow hover:brightness-110 transition-all">
          Send request
        </button>
      </form>
      {error && <p className="text-sm text-pill-red-bg mb-4">{error}</p>}
      {status && <p className="text-sm text-pill-green-bg mb-4">{status}</p>}

      {incoming.length > 0 && (
        <Section title="Incoming requests">
          {incoming.map((l) => (
            <Row key={l.id}>
              <span>{l.friend.displayName} (@{l.friend.username})</span>
              <div className="flex gap-2">
                <button onClick={() => respond(l.id, "accept")} className="text-xs bg-pill-green-bg text-white rounded-md px-3 py-1.5">
                  Accept
                </button>
                <button onClick={() => respond(l.id, "decline")} className="text-xs bg-base-panel2 rounded-md px-3 py-1.5">
                  Decline
                </button>
              </div>
            </Row>
          ))}
        </Section>
      )}

      {outgoing.length > 0 && (
        <Section title="Pending (sent)">
          {outgoing.map((l) => (
            <Row key={l.id}>
              <span>{l.friend.displayName} (@{l.friend.username})</span>
              <span className="text-xs text-base-muted">Waiting for them to accept...</span>
            </Row>
          ))}
        </Section>
      )}

      <Section title="Your friends">
        {accepted.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-base-muted">
            <div className="text-2xl mb-2">🤝</div>
            No friends yet — send a request above to get started.
          </div>
        )}
        {accepted.map((l) => (
          <Row key={l.id}>
            <span>{l.friend.displayName} (@{l.friend.username})</span>
            <div className="flex gap-2">
              <button onClick={() => viewFriend(l.friend)} className="text-xs bg-brand-gradient text-white rounded-md px-3 py-1.5 shadow-glow hover:brightness-110 transition-all">
                View journal
              </button>
              <button onClick={() => removeFriend(l.id)} className="text-xs text-pill-red-bg px-2 py-1.5 hover:underline">
                Remove
              </button>
            </div>
          </Row>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <h2 className="text-sm font-medium text-base-muted mb-2">{title}</h2>
      <div className="glass-panel border border-base-border rounded-2xl divide-y divide-base-border/60">{children}</div>
    </motion.div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between px-4 py-3 text-sm">{children}</div>;
}
