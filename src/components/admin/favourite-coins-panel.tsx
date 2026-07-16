"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FavouriteCoin } from "@/types";
import { cn } from "@/lib/utils";
import {
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Star,
  Trash2,
  Users,
} from "lucide-react";

interface FavouriteCoinsPanelProps {
  selectedPair: string;
  onSelectPair: (pair: string) => void;
  onPublished?: (message: string) => void;
  onError?: (message: string) => void;
  className?: string;
}

export function FavouriteCoinsPanel({
  selectedPair,
  onSelectPair,
  onPublished,
  onError,
  className,
}: FavouriteCoinsPanelProps) {
  const [coins, setCoins] = useState<FavouriteCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPair, setNewPair] = useState("");
  const [adding, setAdding] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadCoins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/favourite-coins");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load favourites");
      setCoins(data.coins ?? []);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to load favourites");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadCoins();
  }, [loadCoins]);

  const handleAdd = async () => {
    const pair = newPair.trim().toUpperCase();
    if (!pair) return;

    setAdding(true);
    try {
      const res = await fetch("/api/admin/favourite-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pair }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add coin");
      setNewPair("");
      await loadCoins();
      onSelectPair(data.coin.pair);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to add coin");
    } finally {
      setAdding(false);
    }
  };

  const togglePublished = async (coin: FavouriteCoin) => {
    setTogglingId(coin.id);
    try {
      const res = await fetch(`/api/admin/favourite-coins?id=${coin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          published: !coin.published,
          notify_students: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update coin");

      await loadCoins();
      if (data.coin.published) {
        onPublished?.(`${data.coin.pair} is now visible on the student portal`);
      } else {
        onPublished?.(`${data.coin.pair} removed from student portal`);
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to update coin");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this favourite coin?")) return;
    try {
      const res = await fetch(`/api/admin/favourite-coins?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete coin");
      await loadCoins();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to delete coin");
    }
  };

  const publishedCount = coins.filter((c) => c.published).length;

  return (
    <Card className={cn("p-4 sm:p-5 h-fit lg:sticky lg:top-24", className)}>
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-[var(--portal-fg,#fff)] flex items-center gap-2">
            <Star className="w-5 h-5 text-[#D4AF37]" />
            Favourite Coins
          </h2>
          <p className="text-[var(--portal-muted-2,#666)] text-xs mt-1">
            Select for signal · Toggle eye to send to students
          </p>
        </div>
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded-lg">
          <Users className="w-3 h-3" />
          {publishedCount} live
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          value={newPair}
          onChange={(e) => setNewPair(e.target.value.toUpperCase())}
          placeholder="Add pair e.g. SOL/USDT"
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
        />
        <Button
          type="button"
          variant="gold"
          size="sm"
          disabled={adding || !newPair.trim()}
          onClick={handleAdd}
          className="shrink-0 min-h-[44px] px-3"
          aria-label="Add favourite coin"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-[var(--portal-muted,#A8A8A8)]">
          <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
        </div>
      ) : coins.length === 0 ? (
        <p className="text-[var(--portal-muted-2,#666)] text-sm text-center py-6">
          Add coins your team trades most often
        </p>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto hide-scrollbar">
          {coins.map((coin) => {
            const selected = selectedPair === coin.pair;
            const busy = togglingId === coin.id;

            return (
              <div
                key={coin.id}
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-xl border transition-all",
                  selected
                    ? "border-[#D4AF37]/50 bg-[#D4AF37]/10"
                    : "border-[var(--portal-border,rgba(212,175,55,0.15))] bg-[var(--portal-bg-subtle,#101010)]"
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectPair(coin.pair)}
                  className="flex-1 text-left min-w-0 touch-target"
                >
                  <p className="text-sm font-semibold text-[var(--portal-fg,#fff)] truncate">
                    {coin.pair}
                  </p>
                  <p className="text-[10px] text-[var(--portal-muted-2,#666)]">
                    {coin.published ? "On student portal" : "Admin only"}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => togglePublished(coin)}
                  disabled={busy}
                  title={coin.published ? "Hide from students" : "Show on student portal"}
                  className={cn(
                    "touch-target p-2 rounded-lg transition-colors",
                    coin.published
                      ? "text-[#FFD700] bg-[#D4AF37]/15"
                      : "text-[var(--portal-muted,#888)] hover:text-[#FFD700]"
                  )}
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : coin.published ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(coin.id)}
                  className="touch-target p-2 rounded-lg text-red-400/70 hover:text-red-400"
                  aria-label={`Delete ${coin.pair}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {publishedCount > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--portal-border,rgba(212,175,55,0.12))]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--portal-muted-2,#666)] mb-2">
            Student portal preview
          </p>
          <div className="flex flex-wrap gap-1.5">
            {coins
              .filter((c) => c.published)
              .map((coin) => (
                <span
                  key={coin.id}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#D4AF37]/15 text-[#FFD700] border border-[#D4AF37]/30"
                >
                  {coin.pair}
                </span>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
}
