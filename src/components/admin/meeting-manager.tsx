"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LiveMeeting, MeetingAudience, MeetingStatus } from "@/types";
import { cn } from "@/lib/utils";
import {
  Bell,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  MessageCircle,
  MonitorPlay,
  Radio,
  Sparkles,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";

const TITLE_PRESETS = [
  "Weekly Market Analysis",
  "Live Q&A Session",
  "Strategy Workshop",
  "Trading Room Live",
];

const DURATIONS = [30, 45, 60, 90, 120];

const AUDIENCES: {
  value: MeetingAudience;
  label: string;
  hint: string;
  icon: typeof Users;
}[] = [
  { value: "all", label: "All Students", hint: "Everyone enrolled", icon: Users },
  {
    value: "pro_elite",
    label: "PRO & ELITE",
    hint: "Premium tiers only",
    icon: Sparkles,
  },
];

type FilterTab = "all" | MeetingStatus;

const emptyForm = () => ({
  title: "",
  description: "",
  meeting_url: "",
  scheduled_at: "",
  duration_minutes: 60,
  audience: "all" as MeetingAudience,
  notify_students: true,
});

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addMinutes(minutes: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return toDatetimeLocal(d);
}

function tomorrowAt(hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return toDatetimeLocal(d);
}

function tonightAt(hour: number): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  if (d <= new Date()) d.setDate(d.getDate() + 1);
  return toDatetimeLocal(d);
}

function detectPlatform(url: string): "zoom" | "meet" | "telegram" | "other" {
  const lower = url.toLowerCase();
  if (lower.includes("zoom.us")) return "zoom";
  if (lower.includes("meet.google.com") || lower.includes("google.com/meet")) return "meet";
  if (lower.includes("t.me") || lower.includes("telegram")) return "telegram";
  return "other";
}

function platformLabel(platform: ReturnType<typeof detectPlatform>): string {
  if (platform === "zoom") return "Zoom";
  if (platform === "meet") return "Google Meet";
  if (platform === "telegram") return "Telegram";
  return "Video Link";
}

function formatSchedule(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusBadgeVariant(status: MeetingStatus) {
  if (status === "live") return "success";
  if (status === "scheduled") return "gold";
  if (status === "cancelled") return "danger";
  return "default";
}

export function MeetingManager() {
  const [meetings, setMeetings] = useState<LiveMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [form, setForm] = useState(emptyForm);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/meetings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load meetings");
      setMeetings(data.meetings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  const stats = useMemo(
    () => ({
      scheduled: meetings.filter((m) => m.status === "scheduled").length,
      live: meetings.filter((m) => m.status === "live").length,
      total: meetings.length,
    }),
    [meetings]
  );

  const filteredMeetings = useMemo(() => {
    if (filter === "all") return meetings;
    return meetings.filter((m) => m.status === filter);
  }, [meetings, filter]);

  const nextMeeting = useMemo(() => {
    const now = Date.now();
    return meetings
      .filter((m) => m.status === "scheduled" || m.status === "live")
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .find((m) => m.status === "live" || new Date(m.scheduled_at).getTime() >= now - 3600000);
  }, [meetings]);

  const previewWhen = form.scheduled_at
    ? formatSchedule(form.scheduled_at)
    : "Pick a date & time above";

  const previewPlatform = form.meeting_url
    ? platformLabel(detectPlatform(form.meeting_url))
    : "Your platform";

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.title.trim() || !form.meeting_url.trim() || !form.scheduled_at) {
      setError("Title, meeting link, and schedule are required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create meeting");

      setForm(emptyForm());
      await loadMeetings();

      const count = data.notified_count ?? 0;
      const emailed = data.emailed_count ?? 0;
      if (data.email_error && emailed === 0) {
        setSuccess(
          count > 0
            ? `Meeting scheduled! ${count} in-app notification${count !== 1 ? "s" : ""}. Email not sent: ${data.email_error}`
            : `Meeting scheduled. Email not sent: ${data.email_error}`
        );
      } else {
        setSuccess(
          `Meeting scheduled! ${count} in-app notification${count !== 1 ? "s" : ""}${
            emailed > 0 ? `, ${emailed} email${emailed !== 1 ? "s" : ""} sent.` : "."
          }`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create meeting");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: MeetingStatus) => {
    setActionId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/meetings?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update meeting");

      await loadMeetings();
      if (status === "live") {
        const emailed = data.emailed_count ?? 0;
        setSuccess(
          emailed > 0
            ? `Session is live — Join Now email sent to ${emailed} student${emailed !== 1 ? "s" : ""}!`
            : data.email_error
              ? `Session is live. Email not sent: ${data.email_error}`
              : "Session is now live — students can join!"
        );
      } else if (status === "completed") setSuccess("Meeting marked as completed.");
      else if (status === "cancelled") setSuccess("Meeting cancelled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update meeting");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this meeting permanently?")) return;
    setActionId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/meetings?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete meeting");
      await loadMeetings();
      setSuccess("Meeting deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete meeting");
    } finally {
      setActionId(null);
    }
  };

  const copyLink = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Could not copy link — try selecting it manually");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--portal-fg,#fff)] flex items-center gap-2">
          <Video className="w-7 h-7 text-[#D4AF37]" />
          Live Meetings
        </h1>
        <p className="text-[var(--portal-muted,#A8A8A8)] text-sm mt-1">
          Schedule Zoom, Google Meet, or Telegram sessions — students join from their portal
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Scheduled", value: stats.scheduled, color: "text-[#FFD700]" },
          { label: "Live Now", value: stats.live, color: "text-green-400" },
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

      {/* Compose + Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] gap-5 items-start">
        <Card className="p-4 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-[var(--portal-fg,#fff)] mb-1">
            Schedule Meeting
          </h2>
          <p className="text-[var(--portal-muted-2,#666)] text-xs sm:text-sm mb-5">
            Paste your link, pick a time, and publish — students get notified instantly
          </p>

          <form onSubmit={handleCreate} className="space-y-5">
            {/* Title + presets */}
            <div className="space-y-2">
              <Input
                label="Session Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Weekly Market Analysis"
                required
              />
              <div className="flex flex-wrap gap-1.5">
                {TITLE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, title: preset }))}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors",
                      form.title === preset
                        ? "bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#FFD700]"
                        : "border-[var(--portal-border,rgba(212,175,55,0.15))] text-[var(--portal-muted,#A8A8A8)] hover:border-[#D4AF37]/30"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Meeting Link"
              value={form.meeting_url}
              onChange={(e) => setForm((f) => ({ ...f, meeting_url: e.target.value }))}
              placeholder="https://meet.google.com/abc-defg-hij"
              required
            />

            {/* Quick schedule */}
            <div className="space-y-2">
              <Input
                label="Date & Time"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                required
              />
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "In 30 min", value: addMinutes(30) },
                  { label: "In 1 hour", value: addMinutes(60) },
                  { label: "Tonight 7 PM", value: tonightAt(19) },
                  { label: "Tomorrow 9 AM", value: tomorrowAt(9) },
                ].map((slot) => (
                  <button
                    key={slot.label}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, scheduled_at: slot.value }))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[var(--portal-border,rgba(212,175,55,0.15))] text-[var(--portal-muted,#A8A8A8)] hover:border-[#D4AF37]/30 hover:text-[var(--portal-fg,#fff)] transition-colors"
                  >
                    <CalendarClock className="w-3 h-3" />
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration pills */}
            <div className="space-y-2">
              <span className="block text-sm font-medium text-[var(--portal-muted,#A8A8A8)] uppercase tracking-wider">
                Duration
              </span>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, duration_minutes: mins }))}
                    className={cn(
                      "px-3 py-2 rounded-xl border text-sm font-semibold transition-all min-w-[56px]",
                      form.duration_minutes === mins
                        ? "bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#FFD700]"
                        : "border-[var(--portal-border,rgba(212,175,55,0.2))] text-[var(--portal-muted,#A8A8A8)] hover:border-[#D4AF37]/30"
                    )}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Audience pills */}
            <div className="space-y-2">
              <span className="block text-sm font-medium text-[var(--portal-muted,#A8A8A8)] uppercase tracking-wider">
                Who Can Join
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AUDIENCES.map((aud) => {
                  const Icon = aud.icon;
                  const active = form.audience === aud.value;
                  return (
                    <button
                      key={aud.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, audience: aud.value }))}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                        active
                          ? "bg-[#D4AF37]/12 border-[#D4AF37]/50"
                          : "border-[var(--portal-border,rgba(212,175,55,0.2))] hover:border-[#D4AF37]/30"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5 shrink-0 mt-0.5",
                          active ? "text-[#FFD700]" : "text-[var(--portal-muted,#A8A8A8)]"
                        )}
                      />
                      <div>
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            active
                              ? "text-[#FFD700]"
                              : "text-[var(--portal-fg,#fff)]"
                          )}
                        >
                          {aud.label}
                        </p>
                        <p className="text-[11px] text-[var(--portal-muted-2,#666)] mt-0.5">
                          {aud.hint}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              label="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Market breakdown, live Q&A, and trade review"
            />

            {/* Preview */}
            <div className="rounded-xl border border-[var(--portal-border,rgba(212,175,55,0.2))] bg-[var(--portal-bg-subtle,#0a0a0a)] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[var(--portal-muted-2,#666)] mb-2">
                Student notification preview
              </p>
              <p className="text-[var(--portal-fg,#fff)] text-sm font-medium">
                Live Meeting: {form.title || "Your session title"}
              </p>
              <p className="text-[var(--portal-muted,#A8A8A8)] text-xs mt-1">
                {previewWhen} · {form.duration_minutes} min · {previewPlatform}
              </p>
              {form.description && (
                <p className="text-[var(--portal-muted-2,#666)] text-xs mt-1 italic">
                  {form.description}
                </p>
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
                Notify students (in-app + email with Join link)
              </span>
            </label>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button
                type="submit"
                variant="gold"
                size="md"
                disabled={
                  saving ||
                  !form.title.trim() ||
                  !form.meeting_url.trim() ||
                  !form.scheduled_at
                }
                className="w-full sm:w-auto min-h-[44px]"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                {saving ? "Scheduling..." : "Schedule Meeting"}
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

        {/* Quick guide sidebar */}
        <Card className="p-4 sm:p-5 h-fit lg:sticky lg:top-24 order-first lg:order-none">
          <h3 className="font-heading text-sm font-semibold text-[var(--portal-fg,#fff)] flex items-center gap-2 mb-3">
            <MonitorPlay className="w-4 h-4 text-[#D4AF37]" />
            Quick Setup Guide
          </h3>

          {nextMeeting && (
            <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/8 p-3 mb-4">
              <p className="text-[10px] uppercase tracking-wider text-[#FFD700] mb-1">
                {nextMeeting.status === "live" ? "Live now" : "Up next"}
              </p>
              <p className="text-sm font-semibold text-[var(--portal-fg,#fff)] truncate">
                {nextMeeting.title}
              </p>
              <p className="text-xs text-[var(--portal-muted,#A8A8A8)] mt-1">
                {formatSchedule(nextMeeting.scheduled_at)}
              </p>
              {nextMeeting.status === "scheduled" && (
                <Button
                  variant="gold"
                  size="sm"
                  className="w-full mt-3 min-h-[40px]"
                  disabled={actionId === nextMeeting.id}
                  onClick={() => updateStatus(nextMeeting.id, "live")}
                >
                  {actionId === nextMeeting.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Radio className="w-4 h-4" />
                  )}
                  Go Live Now
                </Button>
              )}
            </div>
          )}

          <div className="space-y-3 text-xs text-[var(--portal-muted,#A8A8A8)]">
            {[
              {
                icon: Video,
                title: "Zoom",
                steps: "Start a meeting → Copy invite link → Paste above",
              },
              {
                icon: MonitorPlay,
                title: "Google Meet",
                steps: "New meeting → Copy link → Paste above",
              },
              {
                icon: MessageCircle,
                title: "Telegram",
                steps: "Create voice chat or live stream → Copy t.me link",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex gap-3 p-3 rounded-xl border border-[var(--portal-border,rgba(212,175,55,0.12))]"
                >
                  <Icon className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[var(--portal-fg,#fff)] text-sm">
                      {item.title}
                    </p>
                    <p className="mt-0.5 leading-relaxed">{item.steps}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-[var(--portal-muted-2,#666)] mt-4 leading-relaxed">
            Tip: Use quick time buttons to schedule faster. Students see meetings under{" "}
            <span className="text-[#D4AF37]">Dashboard → Live</span>.
          </p>
        </Card>
      </div>

      {/* Meeting history */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="font-heading text-lg font-semibold text-[var(--portal-fg,#fff)]">
            Meeting History
          </h2>
          <div className="flex gap-1 p-1 rounded-xl bg-[var(--portal-bg-elevated,#101010)] border border-[var(--portal-border,rgba(212,175,55,0.15))] overflow-x-auto">
            {(["all", "scheduled", "live", "completed", "cancelled"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors",
                  filter === tab
                    ? "bg-[#D4AF37]/20 text-[#FFD700]"
                    : "text-[var(--portal-muted,#A8A8A8)] hover:text-[var(--portal-fg,#fff)]"
                )}
              >
                {tab === "live" ? "live now" : tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[var(--portal-muted,#A8A8A8)]">
            <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37] mr-2" />
            Loading meetings...
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="glass-card p-8 sm:p-10 text-center">
            <Video className="w-10 h-10 text-[#D4AF37]/40 mx-auto mb-3" />
            <p className="text-[var(--portal-fg,#fff)] text-sm font-medium">
              {filter === "all" ? "No meetings yet" : `No ${filter} meetings`}
            </p>
            <p className="text-[var(--portal-muted-2,#666)] text-xs mt-1 max-w-sm mx-auto">
              Use the form above to schedule your first live session — students will get a
              notification with the join link
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMeetings.map((meeting) => {
              const platform = detectPlatform(meeting.meeting_url);
              const isLive = meeting.status === "live";

              return (
                <Card
                  key={meeting.id}
                  className={cn(
                    "p-4 sm:p-5 transition-colors",
                    isLive && "border-green-500/40 bg-green-500/5"
                  )}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-heading text-lg font-bold text-[var(--portal-fg,#fff)]">
                          {meeting.title}
                        </h3>
                        <Badge variant={statusBadgeVariant(meeting.status)}>
                          {isLive ? "● Live Now" : meeting.status}
                        </Badge>
                        <Badge variant="default">
                          {meeting.audience === "pro_elite" ? "PRO/ELITE" : "All Students"}
                        </Badge>
                        <Badge variant="default">{platformLabel(platform)}</Badge>
                      </div>

                      {meeting.description && (
                        <p className="text-[var(--portal-muted,#A8A8A8)] text-sm mb-3">
                          {meeting.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 text-sm text-[var(--portal-muted,#A8A8A8)]">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                          {formatSchedule(meeting.scheduled_at)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                          {meeting.duration_minutes} min
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <a
                          href={meeting.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#D4AF37] text-sm hover:text-[#FFD700] transition-colors"
                        >
                          Open link <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyLink(meeting.id, meeting.meeting_url)}
                          className="inline-flex items-center gap-1.5 text-[var(--portal-muted,#A8A8A8)] text-sm hover:text-[var(--portal-fg,#fff)] transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {copiedId === meeting.id ? "Copied!" : "Copy link"}
                        </button>
                      </div>

                      <p className="text-[var(--portal-muted-2,#666)] text-xs mt-2">
                        {meeting.created_by_name} ·{" "}
                        {new Date(meeting.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      {meeting.status === "scheduled" && (
                        <Button
                          variant="gold"
                          size="sm"
                          disabled={actionId === meeting.id}
                          onClick={() => updateStatus(meeting.id, "live")}
                          className="min-h-[40px]"
                        >
                          {actionId === meeting.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Radio className="w-3.5 h-3.5" />
                          )}
                          Go Live
                        </Button>
                      )}
                      {meeting.status === "live" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionId === meeting.id}
                          onClick={() => updateStatus(meeting.id, "completed")}
                        >
                          End Session
                        </Button>
                      )}
                      {(meeting.status === "scheduled" || meeting.status === "live") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionId === meeting.id}
                          onClick={() => updateStatus(meeting.id, "cancelled")}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionId === meeting.id}
                        onClick={() => handleDelete(meeting.id)}
                        aria-label="Delete meeting"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
