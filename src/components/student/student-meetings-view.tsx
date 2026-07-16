"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  Radio,
  Video,
} from "lucide-react";
import type { LiveMeeting } from "@/types";

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

function timeUntil(iso: string): string | null {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours >= 48) return `${Math.floor(hours / 24)} days away`;
  if (hours >= 1) return `Starts in ${hours}h ${mins}m`;
  return `Starts in ${mins} min`;
}

export function StudentMeetingsView() {
  const [meetings, setMeetings] = useState<LiveMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/meetings")
      .then((res) => res.json())
      .then((data) => setMeetings(data.meetings ?? []))
      .finally(() => setLoading(false));
  }, []);

  const { live, upcoming } = useMemo(() => {
    const liveMeetings = meetings.filter((m) => m.status === "live");
    const upcomingMeetings = meetings.filter((m) => m.status === "scheduled");
    return { live: liveMeetings, upcoming: upcomingMeetings };
  }, [meetings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--portal-muted,#A8A8A8)]">
        <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37] mr-2" />
        Loading meetings...
      </div>
    );
  }

  const renderCard = (meeting: LiveMeeting, isLive: boolean) => {
    const countdown = !isLive ? timeUntil(meeting.scheduled_at) : null;

    return (
      <div
        key={meeting.id}
        className={cn(
          "glass-card p-4 sm:p-5 transition-colors",
          isLive && "border-green-500/40 bg-green-500/5"
        )}
      >
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h2 className="font-heading text-lg font-bold text-[var(--portal-fg,#fff)]">
            {meeting.title}
          </h2>
          <Badge variant={isLive ? "success" : "gold"}>
            {isLive ? "● Live Now" : "Scheduled"}
          </Badge>
          {countdown && (
            <span className="text-[11px] font-medium text-[#FFD700] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">
              {countdown}
            </span>
          )}
        </div>

        {meeting.description && (
          <p className="text-[var(--portal-muted,#A8A8A8)] text-sm mb-3 leading-relaxed">
            {meeting.description}
          </p>
        )}

        <div className="flex flex-wrap gap-3 text-sm text-[var(--portal-muted-2,#666)] mb-4">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
            {formatWhen(meeting.scheduled_at)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
            {meeting.duration_minutes} min
          </span>
        </div>

        <a href={meeting.meeting_url} target="_blank" rel="noopener noreferrer">
          <Button
            variant="gold"
            size="md"
            className={cn("touch-target min-h-[44px] w-full sm:w-auto", isLive && "animate-pulse")}
          >
            {isLive ? (
              <Radio className="w-4 h-4" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            {isLive ? "Join Live Session" : "Open Meeting Link"}
          </Button>
        </a>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-4">
      <div>
        <p className="text-[#D4AF37] text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1">
          Live Sessions
        </p>
        <h1 className="font-heading text-xl sm:text-3xl font-bold text-[var(--portal-fg,#fff)] flex items-center gap-2">
          <Video className="w-6 h-6 text-[#D4AF37]" />
          Live Meetings
        </h1>
        <p className="text-[var(--portal-muted-2,#666)] text-xs sm:text-sm mt-1">
          Join scheduled strategy sessions and market breakdowns
        </p>
      </div>

      {live.length === 0 && upcoming.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Video className="w-10 h-10 text-[#D4AF37]/40 mx-auto mb-3" />
          <p className="text-[var(--portal-fg,#fff)] font-medium">No upcoming meetings</p>
          <p className="text-[var(--portal-muted-2,#666)] text-sm mt-1 max-w-xs mx-auto">
            You&apos;ll get a notification when your admin schedules a live session
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {live.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider text-green-400 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Happening Now
              </h2>
              {live.map((meeting) => renderCard(meeting, true))}
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider text-[var(--portal-muted,#A8A8A8)] font-semibold">
                Upcoming Sessions
              </h2>
              {upcoming.map((meeting) => renderCard(meeting, false))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
