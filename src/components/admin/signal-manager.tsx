"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TradingSignal, SignalDirection, SignalStatus } from "@/types";
import { cn } from "@/lib/utils";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Eye,
  Loader2,
  Radio,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { FavouriteCoinsPanel } from "@/components/admin/favourite-coins-panel";

const DIRECTIONS: {
  value: SignalDirection;
  label: string;
  icon: typeof ArrowUpRight;
  activeClass: string;
}[] = [
  {
    value: "buy",
    label: "Buy",
    icon: ArrowUpRight,
    activeClass: "bg-green-500/15 border-green-500/50 text-green-400",
  },
  {
    value: "sell",
    label: "Sell",
    icon: ArrowDownRight,
    activeClass: "bg-red-500/15 border-red-500/50 text-red-400",
  },
  {
    value: "watch",
    label: "Watch",
    icon: Eye,
    activeClass: "bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#FFD700]",
  },
];

const emptyForm = () => ({
  pair: "",
  direction: "buy" as SignalDirection,
  entry: "",
  target: "",
  stop_loss: "",
  notes: "",
  notify_students: true,
});

type FilterTab = "all" | SignalStatus;

export function SignalManager() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [form, setForm] = useState(emptyForm);

  const loadSignals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/signals");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load signals");
      setSignals(data.signals ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load signals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSignals();
  }, [loadSignals]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  const stats = useMemo(
    () => ({
      total: signals.length,
      active: signals.filter((s) => s.status === "active").length,
      closed: signals.filter((s) => s.status === "closed").length,
    }),
    [signals]
  );

  const filteredSignals = useMemo(() => {
    if (filter === "all") return signals;
    return signals.filter((s) => s.status === filter);
  }, [signals, filter]);

  const previewMessage = useMemo(() => {
    const parts = [
      form.entry && `Entry ${form.entry}`,
      form.target && `Target ${form.target}`,
      form.stop_loss && `SL ${form.stop_loss}`,
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : "Fill in levels to preview the alert";
  }, [form.entry, form.target, form.stop_loss]);

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.pair.trim()) {
      setError("Please enter a trading pair (e.g. BTC/USDT)");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send signal");

      setForm(emptyForm());
      await loadSignals();

      const count = data.notified_count ?? 0;
      setSuccess(
        count > 0
          ? `Signal published! ${count} student${count !== 1 ? "s" : ""} notified.`
          : "Signal published! No active students to notify yet."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send signal");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: "closed" | "cancelled") => {
    setActionId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/signals?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update signal");
      await loadSignals();
      setSuccess(status === "closed" ? "Signal marked as closed." : "Signal cancelled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update signal");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this signal permanently?")) return;
    setActionId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/signals?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete signal");
      await loadSignals();
      setSuccess("Signal deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete signal");
    } finally {
      setActionId(null);
    }
  };

  const directionBadge = (direction: SignalDirection) => {
    if (direction === "buy") return "success";
    if (direction === "sell") return "danger";
    return "gold";
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--portal-fg,#fff)] flex items-center gap-2">
          <Radio className="w-7 h-7 text-[#D4AF37]" />
          Trading Signals
        </h1>
        <p className="text-[var(--portal-muted,#A8A8A8)] text-sm mt-1">
          Publish signals — students see them instantly in their portal
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", value: stats.active, color: "text-[#FFD700]" },
          { label: "Closed", value: stats.closed, color: "text-[var(--portal-muted,#A8A8A8)]" },
          { label: "Total", value: stats.total, color: "text-[var(--portal-fg,#fff)]" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-3 sm:p-4 text-center">
            <p className={cn("font-numbers text-xl sm:text-2xl font-bold", stat.color)}>
              {stat.value}
            </p>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--portal-muted-2,#666)] mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {success && (
        <div className="glass-card p-4 border-green-500/30 bg-green-500/5 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <p className="text-green-400 text-sm flex-1">{success}</p>
          <button type="button" onClick={() => setSuccess(null)} aria-label="Dismiss">
            <X className="w-4 h-4 text-green-400/70" />
          </button>
        </div>
      )}

      {error && (
        <div className="glass-card p-4 border-red-500/30 bg-red-500/5 flex items-start gap-3">
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            <X className="w-4 h-4 text-red-400/70" />
          </button>
        </div>
      )}

      {/* Compose + Favourites side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] gap-5 items-start">
      <Card className="p-4 sm:p-6">
        <h2 className="font-heading text-lg font-semibold text-[var(--portal-fg,#fff)] mb-1">
          New Signal
        </h2>
        <p className="text-[var(--portal-muted-2,#666)] text-xs sm:text-sm mb-5">
          Fill in the details and hit Publish — students get a notification right away
        </p>

        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-2">
            <Input
              label="Trading Pair"
              value={form.pair}
              onChange={(e) => setForm((f) => ({ ...f, pair: e.target.value.toUpperCase() }))}
              placeholder="BTC/USDT — or pick from favourites →"
              required
            />
          </div>

          {/* Direction pills */}
          <div className="space-y-2">
            <span className="block text-sm font-medium text-[var(--portal-muted,#A8A8A8)] uppercase tracking-wider">
              Direction
            </span>
            <div className="grid grid-cols-3 gap-2">
              {DIRECTIONS.map((dir) => {
                const Icon = dir.icon;
                const active = form.direction === dir.value;
                return (
                  <button
                    key={dir.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, direction: dir.value }))}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-semibold transition-all",
                      active
                        ? dir.activeClass
                        : "border-[var(--portal-border,rgba(212,175,55,0.2))] text-[var(--portal-muted,#A8A8A8)] hover:border-[#D4AF37]/30"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {dir.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price levels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Entry"
              value={form.entry}
              onChange={(e) => setForm((f) => ({ ...f, entry: e.target.value }))}
              placeholder="68500"
              inputMode="decimal"
            />
            <Input
              label="Target"
              value={form.target}
              onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
              placeholder="70200"
              inputMode="decimal"
            />
            <Input
              label="Stop Loss"
              value={form.stop_loss}
              onChange={(e) => setForm((f) => ({ ...f, stop_loss: e.target.value }))}
              placeholder="67800"
              inputMode="decimal"
            />
          </div>

          <Input
            label="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Breakout setup on 4H timeframe"
          />

          {/* Preview */}
          <div className="rounded-xl border border-[var(--portal-border,rgba(212,175,55,0.2))] bg-[var(--portal-bg-subtle,#0a0a0a)] p-4">
            <p className="text-[10px] uppercase tracking-wider text-[var(--portal-muted-2,#666)] mb-2">
              Student notification preview
            </p>
            <p className="text-[var(--portal-fg,#fff)] text-sm font-medium">
              New {form.direction.toUpperCase()} Signal: {form.pair || "—"}
            </p>
            <p className="text-[var(--portal-muted,#A8A8A8)] text-xs mt-1">{previewMessage}</p>
            {form.notes && (
              <p className="text-[var(--portal-muted-2,#666)] text-xs mt-1 italic">{form.notes}</p>
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.notify_students}
              onChange={(e) =>
                setForm((f) => ({ ...f, notify_students: e.target.checked }))
              }
              className="w-4 h-4 accent-[#D4AF37]"
            />
            <span className="text-sm text-[var(--portal-muted,#A8A8A8)] flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-[#D4AF37]" />
              Notify all active students
            </span>
          </label>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button
              type="submit"
              variant="gold"
              size="md"
              disabled={saving || !form.pair.trim()}
              className="w-full sm:w-auto min-h-[44px]"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {saving ? "Publishing..." : "Publish Signal"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={saving}
              className="w-full sm:w-auto min-h-[44px]"
              onClick={() => {
                setForm(emptyForm());
                setError(null);
              }}
            >
              Clear Form
            </Button>
          </div>
        </form>
      </Card>

      <FavouriteCoinsPanel
        selectedPair={form.pair}
        onSelectPair={(pair) => setForm((f) => ({ ...f, pair }))}
        onPublished={setSuccess}
        onError={setError}
        className="order-first lg:order-none"
      />
      </div>

      {/* Signal history */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="font-heading text-lg font-semibold text-[var(--portal-fg,#fff)]">
            Signal History
          </h2>
          <div className="flex gap-1 p-1 rounded-xl bg-[var(--portal-bg-elevated,#101010)] border border-[var(--portal-border,rgba(212,175,55,0.15))]">
            {(["all", "active", "closed", "cancelled"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                  filter === tab
                    ? "bg-[#D4AF37]/20 text-[#FFD700]"
                    : "text-[var(--portal-muted,#A8A8A8)] hover:text-[var(--portal-fg,#fff)]"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[var(--portal-muted,#A8A8A8)]">
            <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37] mr-2" />
            Loading signals...
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Radio className="w-8 h-8 text-[#D4AF37]/40 mx-auto mb-2" />
            <p className="text-[var(--portal-fg,#fff)] text-sm font-medium">
              {filter === "all" ? "No signals yet" : `No ${filter} signals`}
            </p>
            <p className="text-[var(--portal-muted-2,#666)] text-xs mt-1">
              Use the form above to publish your first signal
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSignals.map((signal) => (
              <Card key={signal.id} className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="font-heading text-lg font-bold text-[var(--portal-fg,#fff)]">
                        {signal.pair}
                      </h3>
                      <Badge variant={directionBadge(signal.direction)}>
                        {signal.direction.toUpperCase()}
                      </Badge>
                      <Badge variant={signal.status === "active" ? "gold" : "default"}>
                        {signal.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {signal.entry && (
                        <div className="rounded-lg bg-[var(--portal-bg-subtle,#101010)] p-2.5 border border-[var(--portal-border,rgba(212,175,55,0.1))]">
                          <p className="text-[10px] uppercase text-[var(--portal-muted-2,#666)]">Entry</p>
                          <p className="text-sm font-medium text-[var(--portal-fg,#fff)]">{signal.entry}</p>
                        </div>
                      )}
                      {signal.target && (
                        <div className="rounded-lg bg-[var(--portal-bg-subtle,#101010)] p-2.5 border border-[var(--portal-border,rgba(212,175,55,0.1))]">
                          <p className="text-[10px] uppercase text-[var(--portal-muted-2,#666)]">Target</p>
                          <p className="text-sm font-medium text-[#FFD700]">{signal.target}</p>
                        </div>
                      )}
                      {signal.stop_loss && (
                        <div className="rounded-lg bg-[var(--portal-bg-subtle,#101010)] p-2.5 border border-[var(--portal-border,rgba(212,175,55,0.1))]">
                          <p className="text-[10px] uppercase text-[var(--portal-muted-2,#666)]">SL</p>
                          <p className="text-sm font-medium text-red-400">{signal.stop_loss}</p>
                        </div>
                      )}
                    </div>
                    {signal.notes && (
                      <p className="text-[var(--portal-muted,#A8A8A8)] text-sm">{signal.notes}</p>
                    )}
                    <p className="text-[var(--portal-muted-2,#666)] text-xs mt-2">
                      {signal.created_by_name} · {new Date(signal.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {signal.status === "active" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionId === signal.id}
                          onClick={() => updateStatus(signal.id, "closed")}
                        >
                          {actionId === signal.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            "Close"
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionId === signal.id}
                          onClick={() => updateStatus(signal.id, "cancelled")}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={actionId === signal.id}
                      onClick={() => handleDelete(signal.id)}
                      aria-label="Delete signal"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
