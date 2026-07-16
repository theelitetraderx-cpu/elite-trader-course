"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  Headphones,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CONTACT, MEMBER_CODE } from "@/lib/constants";
import { FAQ_ITEMS } from "@/lib/data/demo-data";
import { cn } from "@/lib/utils";
import type { SupportQuery, SupportQueryCategory } from "@/lib/data/support-query-store";

const CATEGORIES: { value: SupportQueryCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "course", label: "Course Access" },
  { value: "billing", label: "Billing" },
  { value: "technical", label: "Technical" },
  { value: "account", label: "Account" },
];

const STATUS_LABELS: Record<SupportQuery["status"], string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

function statusVariant(status: SupportQuery["status"]) {
  if (status === "resolved") return "success" as const;
  if (status === "in_progress") return "gold" as const;
  return "default" as const;
}

export function StudentSupportCenter() {
  const [queries, setQueries] = useState<SupportQuery[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [form, setForm] = useState({
    subject: "",
    message: "",
    category: "general" as SupportQueryCategory,
  });

  const loadQueries = useCallback(async () => {
    setLoadingQueries(true);
    try {
      const res = await fetch("/api/student/support-queries");
      const data = await res.json();
      if (res.ok) setQueries(data.queries ?? []);
    } finally {
      setLoadingQueries(false);
    }
  }, []);

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/student/support-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");

      setForm({ subject: "", message: "", category: "general" });
      setSuccess("Your query has been submitted. Our team will respond within 24 hours.");
      await loadQueries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit query");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-10 sm:mt-14 pt-8 border-t border-[var(--portal-border)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center">
          <Headphones className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-[var(--portal-fg)]">
            Support Center
          </h2>
          <p className="text-[var(--portal-muted)] text-sm">
            Get help, ask questions, or track your support requests
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Contact & FAQ */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-5">
            <h3 className="font-heading text-sm font-semibold text-[var(--portal-fg)] mb-4 uppercase tracking-wider">
              Quick Contact
            </h3>
            <div className="space-y-3">
              <a
                href={CONTACT.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-[var(--portal-border)] hover:border-[#D4AF37]/40 transition-colors group"
              >
                <Send className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--portal-fg)] group-hover:text-[#FFD700]">
                    Telegram
                  </p>
                  <p className="text-xs text-[var(--portal-muted)]">{CONTACT.telegram}</p>
                </div>
              </a>
              <a
                href={`mailto:${CONTACT.email}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-[var(--portal-border)] hover:border-[#D4AF37]/40 transition-colors group"
              >
                <Mail className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--portal-fg)] group-hover:text-[#FFD700]">
                    Email Support
                  </p>
                  <p className="text-xs text-[var(--portal-muted)] break-all">{CONTACT.email}</p>
                </div>
              </a>
            </div>
            <p className="text-[10px] text-[var(--portal-muted-3)] mt-4 leading-relaxed">
              {CONTACT.supportNote} Use member code{" "}
              <span className="text-[#D4AF37] font-medium">{MEMBER_CODE}</span> when enrolling.
            </p>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-heading text-sm font-semibold text-[var(--portal-fg)] mb-3 flex items-center gap-2 uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
              FAQ
            </h3>
            <div className="space-y-1">
              {FAQ_ITEMS.slice(0, 4).map((item, idx) => (
                <div key={item.question} className="border-b border-[var(--portal-border)] last:border-0">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between gap-2 py-3 text-left text-sm font-medium text-[var(--portal-fg)] hover:text-[#D4AF37] transition-colors"
                  >
                    <span className="flex-1">{item.question}</span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 shrink-0 text-[var(--portal-muted)] transition-transform",
                        openFaq === idx && "rotate-180"
                      )}
                    />
                  </button>
                  {openFaq === idx && (
                    <p className="text-xs text-[var(--portal-muted)] pb-3 leading-relaxed">
                      {item.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit query + history */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card p-5 sm:p-6">
            <h3 className="font-heading text-sm font-semibold text-[var(--portal-fg)] mb-4 flex items-center gap-2 uppercase tracking-wider">
              <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
              Submit a Query
            </h3>

            {success && (
              <div className="mb-4 p-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                {success}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--portal-muted)] mb-1.5">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                        form.category === cat.value
                          ? "bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#FFD700]"
                          : "border-[var(--portal-border)] text-[var(--portal-muted)] hover:border-[#D4AF37]/30"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--portal-muted)] mb-1.5">
                  Subject
                </label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Brief summary of your question"
                  maxLength={120}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--portal-muted)] mb-1.5">
                  Message
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Describe your issue or question in detail..."
                  rows={4}
                  maxLength={2000}
                  required
                  className="w-full rounded-xl border px-4 py-3 text-sm resize-y min-h-[100px] bg-[var(--portal-input-bg)] border-[var(--portal-border)] text-[var(--portal-fg)] placeholder:text-[var(--portal-muted-2)] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                />
              </div>

              <Button type="submit" variant="gold" disabled={submitting} className="min-h-[44px]">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Query
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="glass-card p-5 sm:p-6">
            <h3 className="font-heading text-sm font-semibold text-[var(--portal-fg)] mb-4 uppercase tracking-wider">
              Your Queries
            </h3>

            {loadingQueries ? (
              <div className="flex items-center justify-center py-8 text-[var(--portal-muted)]">
                <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37] mr-2" />
                Loading...
              </div>
            ) : queries.length === 0 ? (
              <p className="text-[var(--portal-muted)] text-sm text-center py-6">
                No queries yet. Submit a question above and we&apos;ll get back to you.
              </p>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {queries.map((query) => (
                  <div
                    key={query.id}
                    className="p-4 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-bg-subtle)]"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-[var(--portal-fg)] flex-1 min-w-0">
                        {query.subject}
                      </p>
                      <Badge variant={statusVariant(query.status)} className="text-[10px]">
                        {STATUS_LABELS[query.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--portal-muted)] line-clamp-2 mb-2">
                      {query.message}
                    </p>
                    <p className="text-[10px] text-[var(--portal-muted-3)]">
                      {new Date(query.created_at).toLocaleString()} ·{" "}
                      {query.category.replace("_", " ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
