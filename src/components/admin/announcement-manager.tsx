"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Announcement, AnnouncementPriority } from "@/types";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Loader2,
  Megaphone,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";

const PRIORITIES: {
  value: AnnouncementPriority;
  label: string;
  hint: string;
  activeClass: string;
}[] = [
  {
    value: "normal",
    label: "Normal",
    hint: "Standard update",
    activeClass: "bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#FFD700]",
  },
  {
    value: "important",
    label: "Important",
    hint: "High-priority alert",
    activeClass: "bg-amber-500/15 border-amber-500/50 text-amber-400",
  },
];

const emptyForm = () => ({
  title: "",
  message: "",
  priority: "normal" as AnnouncementPriority,
  notify_students: true,
});

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load announcements");
      setAnnouncements(data.announcements ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: announcements.length,
      important: announcements.filter((a) => a.priority === "important").length,
      thisWeek: announcements.filter(
        (a) => new Date(a.created_at).getTime() >= weekAgo
      ).length,
      studentsReached: announcements.reduce((sum, a) => sum + a.notified_count, 0),
    };
  }, [announcements]);

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setError("Title and message are required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send announcement");

      setForm(emptyForm());
      await loadAnnouncements();

      const count = data.notified_count ?? 0;
      setSuccess(
        count > 0
          ? `Announcement sent! ${count} student${count !== 1 ? "s" : ""} notified.`
          : "Announcement saved! No active students to notify yet."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement from history? Students keep their notifications.")) {
      return;
    }

    setActionId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/announcements?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      await loadAnnouncements();
      setSuccess("Announcement removed from history.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--portal-fg,#fff)] flex items-center gap-2">
          <Megaphone className="w-7 h-7 text-[#D4AF37]" />
          Announcements
        </h1>
        <p className="text-[var(--portal-muted,#A8A8A8)] mt-1 text-sm sm:text-base">
          Send messages to all active students. They appear in their dashboard and notifications.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-300 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Sent", value: stats.total, icon: Megaphone },
          { label: "Important", value: stats.important, icon: AlertTriangle },
          { label: "This Week", value: stats.thisWeek, icon: Bell },
          { label: "Students Reached", value: stats.studentsReached, icon: Users },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-2 text-[var(--portal-muted,#A8A8A8)] text-xs mb-1">
              <stat.icon className="w-3.5 h-3.5 text-[#D4AF37]" />
              {stat.label}
            </div>
            <p className="font-heading text-2xl font-bold text-[var(--portal-fg,#fff)]">
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-[var(--portal-fg,#fff)] mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-[#D4AF37]" />
            Compose Message
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--portal-muted,#A8A8A8)] mb-1.5">
                Title
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Platform maintenance tonight"
                maxLength={120}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--portal-muted,#A8A8A8)] mb-1.5">
                Message
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Write your announcement for students..."
                rows={5}
                maxLength={2000}
                className="w-full rounded-xl border px-4 py-3 text-sm resize-y min-h-[120px] bg-[var(--portal-bg-elevated,#101010)] border-[var(--portal-border,rgba(212,175,55,0.25))] text-[var(--portal-fg,#fff)] placeholder:text-[var(--portal-muted-2,#666)] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--portal-muted,#A8A8A8)] mb-2">
                Priority
              </label>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, priority: item.value }))}
                    className={cn(
                      "px-3 py-2 rounded-xl border text-sm font-medium transition-colors",
                      form.priority === item.value
                        ? item.activeClass
                        : "border-[var(--portal-border)] text-[var(--portal-muted)] hover:border-[#D4AF37]/30"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-[var(--portal-muted,#A8A8A8)] cursor-pointer">
              <input
                type="checkbox"
                checked={form.notify_students}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notify_students: e.target.checked }))
                }
                className="rounded border-[var(--portal-border)] accent-[#D4AF37]"
              />
              <Bell className="w-4 h-4 text-[#D4AF37]" />
              Notify all active students
            </label>

            <Button type="submit" variant="gold" disabled={saving} className="w-full sm:w-auto">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Announcement
                </>
              )}
            </Button>
          </form>
        </Card>

        <Card className="p-5 sm:p-6 border-[#D4AF37]/20">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-3">
            Preview
          </h3>
          <div className="rounded-xl border border-[var(--portal-border)] p-4 bg-[var(--portal-bg-elevated)]">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-medium text-[var(--portal-fg,#fff)] text-sm">
                {form.title.trim() || "Announcement title"}
              </span>
              {form.priority === "important" && (
                <Badge variant="danger" className="text-[10px]">
                  Important
                </Badge>
              )}
            </div>
            <p className="text-sm text-[var(--portal-muted,#A8A8A8)] whitespace-pre-wrap">
              {form.message.trim() || "Your message will appear here for students."}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold text-[var(--portal-fg,#fff)] mb-4">
          Sent History
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[var(--portal-muted)]">
            <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37] mr-2" />
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-[var(--portal-muted)] text-sm py-8 text-center">
            No announcements sent yet. Compose your first message above.
          </p>
        ) : (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border p-4 transition-colors",
                  item.priority === "important"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-[var(--portal-border)] bg-[var(--portal-bg-elevated)]"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-medium text-[var(--portal-fg,#fff)]">{item.title}</h3>
                      {item.priority === "important" && (
                        <Badge variant="danger">Important</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[var(--portal-muted,#A8A8A8)] whitespace-pre-wrap">
                      {item.message}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-[var(--portal-muted-2,#666)]">
                      <span>{formatWhen(item.created_at)}</span>
                      <span>by {item.created_by_name}</span>
                      <span>
                        {item.notified_count} student{item.notified_count !== 1 ? "s" : ""} notified
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    disabled={actionId === item.id}
                    className="shrink-0 text-red-400 border-red-500/30 hover:bg-red-500/10"
                  >
                    {actionId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
