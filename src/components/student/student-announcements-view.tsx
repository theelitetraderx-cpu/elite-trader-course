"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2, Megaphone } from "lucide-react";
import type { Announcement } from "@/types";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function StudentAnnouncementsView() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/announcements")
      .then((res) => res.json())
      .then((data) => setAnnouncements(data.announcements ?? []))
      .finally(() => setLoading(false));
  }, []);

  const { important, recent } = useMemo(() => {
    const importantItems = announcements.filter((a) => a.priority === "important");
    const recentItems = announcements.filter((a) => a.priority !== "important");
    return { important: importantItems, recent: recentItems };
  }, [announcements]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--portal-muted,#A8A8A8)]">
        <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37] mr-2" />
        Loading announcements...
      </div>
    );
  }

  const renderCard = (item: Announcement) => (
    <div
      key={item.id}
      className={cn(
        "glass-card p-4 sm:p-5 transition-colors",
        item.priority === "important" && "border-amber-500/40 bg-amber-500/5"
      )}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {item.priority === "important" ? (
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        ) : (
          <Megaphone className="w-4 h-4 text-[#D4AF37]" />
        )}
        <h2 className="font-heading text-lg font-bold text-[var(--portal-fg,#fff)]">
          {item.title}
        </h2>
        {item.priority === "important" && (
          <Badge variant="danger">Important</Badge>
        )}
      </div>
      <p className="text-[var(--portal-muted,#A8A8A8)] text-sm mb-3 leading-relaxed whitespace-pre-wrap">
        {item.message}
      </p>
      <p className="text-xs text-[var(--portal-muted-2,#666)]">
        {formatWhen(item.created_at)} · From {item.created_by_name}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--portal-fg,#fff)] flex items-center gap-2">
          <Megaphone className="w-7 h-7 text-[#D4AF37]" />
          Announcements
        </h1>
        <p className="text-[var(--portal-muted,#A8A8A8)] mt-1 text-sm">
          Updates and messages from The Elite Trader team.
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Megaphone className="w-10 h-10 text-[#D4AF37]/50 mx-auto mb-3" />
          <p className="text-[var(--portal-muted,#A8A8A8)]">No announcements yet.</p>
          <p className="text-[var(--portal-muted-2,#666)] text-sm mt-1">
            Check back for platform updates and important notices.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {important.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Important
              </h2>
              {important.map(renderCard)}
            </section>
          )}
          {(recent.length > 0 || important.length === 0) && (
            <section className="space-y-3">
              {important.length > 0 && (
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                  Recent
                </h2>
              )}
              {(recent.length > 0 ? recent : announcements).map(renderCard)}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
