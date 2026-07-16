"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, Radio, Star } from "lucide-react";
import type { FavouriteCoin, TradingSignal } from "@/types";

export function StudentSignalsView() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [favourites, setFavourites] = useState<FavouriteCoin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/student/signals").then((res) => res.json()),
      fetch("/api/student/favourite-coins").then((res) => res.json()),
    ])
      .then(([signalsData, coinsData]) => {
        setSignals(signalsData.signals ?? []);
        setFavourites(coinsData.coins ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--portal-muted,#A8A8A8)]">
        <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37] mr-2" />
        Loading signals...
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      <div>
        <p className="text-[#D4AF37] text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1">
          Live Trading
        </p>
        <h1 className="font-heading text-xl sm:text-3xl font-bold text-[var(--portal-fg,#fff)] flex items-center gap-2">
          <Radio className="w-6 h-6 text-[#D4AF37]" />
          Signals
        </h1>
        <p className="text-[var(--portal-muted-2,#666)] text-xs sm:text-sm mt-1">
          Active signals and favourite coins from your admin team
        </p>
      </div>

      {favourites.length > 0 && (
        <div className="glass-card p-4 sm:p-5">
          <h2 className="font-heading text-sm font-semibold text-[var(--portal-fg,#fff)] flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-[#D4AF37]" />
            Favourite Coins
          </h2>
          <div className="flex flex-wrap gap-2">
            {favourites.map((coin) => (
              <span
                key={coin.id}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-[#D4AF37]/12 text-[#FFD700] border border-[#D4AF37]/30"
              >
                <Star className="w-3.5 h-3.5 fill-[#D4AF37]/40" />
                {coin.pair}
              </span>
            ))}
          </div>
          <p className="text-[var(--portal-muted-2,#666)] text-xs mt-3">
            These are the pairs your mentors are actively watching
          </p>
        </div>
      )}

      {signals.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Radio className="w-10 h-10 text-[#D4AF37]/40 mx-auto mb-3" />
          <p className="text-[var(--portal-fg,#fff)] font-medium">No active signals</p>
          <p className="text-[var(--portal-muted-2,#666)] text-sm mt-1">
            New signals will appear here when published
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="font-heading text-sm font-semibold text-[var(--portal-muted,#A8A8A8)] uppercase tracking-wider">
            Active Signals
          </h2>
          {signals.map((signal) => (
            <div key={signal.id} className="glass-card p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h3 className="font-heading text-lg font-bold text-[var(--portal-fg,#fff)]">
                  {signal.pair}
                </h3>
                <Badge
                  variant={
                    signal.direction === "buy"
                      ? "success"
                      : signal.direction === "sell"
                        ? "danger"
                        : "gold"
                  }
                >
                  {signal.direction.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                {signal.entry && (
                  <div className="rounded-xl bg-[var(--portal-bg-subtle,#101010)] p-3 border border-[var(--portal-border,rgba(212,175,55,0.1))]">
                    <p className="text-[var(--portal-muted-2,#666)] text-xs uppercase">Entry</p>
                    <p className="text-[var(--portal-fg,#fff)] font-medium">{signal.entry}</p>
                  </div>
                )}
                {signal.target && (
                  <div className="rounded-xl bg-[var(--portal-bg-subtle,#101010)] p-3 border border-[var(--portal-border,rgba(212,175,55,0.1))]">
                    <p className="text-[var(--portal-muted-2,#666)] text-xs uppercase">Target</p>
                    <p className="text-[#FFD700] font-medium">{signal.target}</p>
                  </div>
                )}
                {signal.stop_loss && (
                  <div className="rounded-xl bg-[var(--portal-bg-subtle,#101010)] p-3 border border-[var(--portal-border,rgba(212,175,55,0.1))]">
                    <p className="text-[var(--portal-muted-2,#666)] text-xs uppercase">Stop Loss</p>
                    <p className="text-red-400 font-medium">{signal.stop_loss}</p>
                  </div>
                )}
              </div>
              {signal.notes && (
                <p className="text-[var(--portal-muted,#A8A8A8)] text-sm mt-3 leading-relaxed">
                  {signal.notes}
                </p>
              )}
              <p className="text-[var(--portal-muted-2,#666)] text-xs mt-3">
                {new Date(signal.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
