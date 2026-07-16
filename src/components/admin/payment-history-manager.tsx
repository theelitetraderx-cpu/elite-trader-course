"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  PaymentMethod,
  PaymentPlanType,
  PaymentRecord,
  PaymentStatus,
  User,
} from "@/types";
import { cn, getInitials } from "@/lib/utils";
import { PRICING_PLANS, SIGNAL_PLANS } from "@/lib/data/demo-data";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  Radio,
  Receipt,
  Search,
  Shield,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

type SectionTab = PaymentPlanType;
type FilterTab = "all" | PaymentStatus;

interface SectionStats {
  total: number;
  completed: number;
  pending: number;
  revenue: number;
  students: number;
}

interface PaymentStats {
  total: number;
  completed: number;
  pending: number;
  refunded: number;
  totalRevenue: number;
  monthRevenue: number;
  course: SectionStats;
  signal: SectionStats;
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "paypal", label: "PayPal" },
  { value: "crypto", label: "Crypto" },
  { value: "stripe", label: "Stripe" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

const STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
];

const COURSE_PLANS = PRICING_PLANS.map((plan) => ({
  name: plan.name,
  type: "course" as PaymentPlanType,
  amount: plan.memberPrice,
  hint: plan.description.slice(0, 48) + "...",
}));

const SIGNAL_PLAN_PRESETS = SIGNAL_PLANS.map((plan) => ({
  name: plan.name,
  type: "signal" as PaymentPlanType,
  amount: "salePrice" in plan && plan.salePrice ? plan.salePrice : plan.price,
  hint: plan.description,
}));

const SECTIONS: {
  id: SectionTab;
  label: string;
  subtitle: string;
  icon: typeof BookOpen;
  activeClass: string;
}[] = [
  {
    id: "course",
    label: "Course Enrolments",
    subtitle: "Foundation, PRO & ELITE students",
    icon: BookOpen,
    activeClass: "bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#FFD700]",
  },
  {
    id: "signal",
    label: "Signal Subscriptions",
    subtitle: "Standalone signal plan buyers",
    icon: Radio,
    activeClass: "bg-blue-500/15 border-blue-500/50 text-blue-400",
  },
];

const emptyForm = (planType: PaymentPlanType = "course") => ({
  student_id: "",
  plan_name: "",
  plan_type: planType,
  amount: "",
  payment_method: "upi" as PaymentMethod,
  status: "completed" as PaymentStatus,
  reference: "",
  notes: "",
  paid_at: "",
});

function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function methodLabel(method: PaymentMethod) {
  return METHODS.find((m) => m.value === method)?.label ?? method;
}

function statusBadgeVariant(status: PaymentStatus) {
  if (status === "completed") return "success";
  if (status === "pending") return "gold";
  if (status === "refunded") return "default";
  return "danger";
}

function filterPayments(
  payments: PaymentRecord[],
  planType: PaymentPlanType,
  filter: FilterTab,
  search: string
) {
  const query = search.trim().toLowerCase();
  return payments.filter((payment) => {
    if (payment.plan_type !== planType) return false;
    if (filter !== "all" && payment.status !== filter) return false;
    if (!query) return true;
    return (
      payment.student_name.toLowerCase().includes(query) ||
      payment.student_email.toLowerCase().includes(query) ||
      payment.plan_name.toLowerCase().includes(query) ||
      payment.reference?.toLowerCase().includes(query)
    );
  });
}

function PaymentCard({
  payment,
  actionId,
  onComplete,
  onRefund,
  onDelete,
}: {
  payment: PaymentRecord;
  actionId: string | null;
  onComplete: (id: string) => void;
  onRefund: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center text-[#050505] font-bold text-sm shrink-0">
            {getInitials(payment.student_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-heading text-base font-bold text-[var(--portal-fg,#fff)]">
                {payment.student_name}
              </h3>
              <Badge variant={statusBadgeVariant(payment.status)}>
                {payment.status}
              </Badge>
            </div>
            <p className="text-sm text-[var(--portal-muted,#A8A8A8)] truncate">
              {payment.plan_name}
            </p>
            <p className="text-xs text-[var(--portal-muted-2,#666)] truncate">
              {payment.student_email}
            </p>
            <p className="font-numbers text-xl font-bold text-[#FFD700] mt-2">
              {formatMoney(payment.amount, payment.currency)}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-[var(--portal-muted-2,#666)] mt-2">
              <span>{methodLabel(payment.payment_method)}</span>
              {payment.reference && <span>Ref: {payment.reference}</span>}
              <span>{formatDate(payment.paid_at)}</span>
            </div>
            {payment.notes && (
              <p className="text-xs text-[var(--portal-muted,#A8A8A8)] mt-2 italic">
                {payment.notes}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {payment.status === "pending" && (
            <Button
              variant="gold"
              size="sm"
              disabled={actionId === payment.id}
              onClick={() => onComplete(payment.id)}
              className="min-h-[40px]"
            >
              {actionId === payment.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Mark Paid
            </Button>
          )}
          {payment.status === "completed" && (
            <Button
              variant="outline"
              size="sm"
              disabled={actionId === payment.id}
              onClick={() => onRefund(payment.id)}
            >
              Refund
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={actionId === payment.id}
            onClick={() => onDelete(payment.id)}
            aria-label="Delete payment"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function PaymentHistoryManager() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [section, setSection] = useState<SectionTab>("course");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm("course"));

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [paymentsRes, usersRes] = await Promise.all([
        fetch("/api/admin/payments"),
        fetch("/api/admin/users"),
      ]);
      const paymentsData = await paymentsRes.json();
      const usersData = await usersRes.json();

      if (!paymentsRes.ok) {
        throw new Error(paymentsData.error ?? "Failed to load payments");
      }
      if (!usersRes.ok) {
        throw new Error(usersData.error ?? "Failed to load students");
      }

      setPayments(paymentsData.payments ?? []);
      setStats(paymentsData.stats ?? null);
      setStudents(
        (usersData.users ?? []).filter((user: User) => user.role === "student")
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  const switchSection = (next: SectionTab) => {
    setSection(next);
    setFilter("all");
    setSearch("");
    setForm(emptyForm(next));
    setError(null);
  };

  const sectionMeta = SECTIONS.find((s) => s.id === section)!;
  const sectionStats = stats?.[section];
  const planPresets = section === "course" ? COURSE_PLANS : SIGNAL_PLAN_PRESETS;

  const sectionPayments = useMemo(
    () => filterPayments(payments, section, filter, search),
    [payments, section, filter, search]
  );

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === form.student_id) ?? null,
    [students, form.student_id]
  );

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedStudent || !form.plan_name.trim() || !form.amount) {
      setError("Student, plan, and amount are required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          student_name: selectedStudent.full_name,
          student_email: selectedStudent.email,
          plan_name: form.plan_name,
          plan_type: section,
          amount: Number(form.amount),
          payment_method: form.payment_method,
          status: form.status,
          reference: form.reference || undefined,
          notes: form.notes || undefined,
          paid_at: form.paid_at || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to record payment");

      setForm(emptyForm(section));
      await loadData();
      setSuccess(
        section === "course"
          ? "Course payment recorded successfully."
          : "Signal subscription payment recorded successfully."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: PaymentStatus) => {
    setActionId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payments?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update payment");
      setPayments((prev) => prev.map((p) => (p.id === id ? data.payment : p)));
      if (data.stats) setStats(data.stats);
      setSuccess(`Payment marked as ${status}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update payment");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this payment record permanently?")) return;
    setActionId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payments?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete payment");
      setPayments((prev) => prev.filter((p) => p.id !== id));
      if (data.stats) setStats(data.stats);
      setSuccess("Payment record deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete payment");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--portal-fg,#fff)] flex items-center gap-2">
          <Receipt className="w-7 h-7 text-[#D4AF37]" />
          Payment History
        </h1>
        <p className="text-[var(--portal-muted,#A8A8A8)] text-sm mt-1 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#D4AF37]" />
          Admin-only — course enrolments and signal subscriptions are tracked separately
        </p>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue", value: formatMoney(stats?.totalRevenue ?? 0), color: "text-[#FFD700]" },
          { label: "This Month", value: formatMoney(stats?.monthRevenue ?? 0), color: "text-green-400" },
          { label: "Course Students", value: stats?.course.students ?? 0, color: "text-[var(--portal-fg,#fff)]" },
          { label: "Signal Users", value: stats?.signal.students ?? 0, color: "text-blue-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-3 sm:p-4 text-center">
            <p className={cn("font-numbers text-lg sm:text-2xl font-bold", stat.color)}>
              {stat.value}
            </p>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--portal-muted-2,#666)] mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Section switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SECTIONS.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          const data = stats?.[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => switchSection(item.id)}
              className={cn(
                "flex items-start gap-4 p-4 sm:p-5 rounded-xl border text-left transition-all",
                active
                  ? item.activeClass
                  : "border-[var(--portal-border,rgba(212,175,55,0.2))] hover:border-[#D4AF37]/30 bg-[var(--portal-bg-elevated,#101010)]"
              )}
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                  active ? "bg-current/10" : "bg-[#D4AF37]/10"
                )}
              >
                <Icon className={cn("w-5 h-5", active ? "text-current" : "text-[#D4AF37]")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-[var(--portal-fg,#fff)]">
                  {item.label}
                </p>
                <p className="text-xs text-[var(--portal-muted-2,#666)] mt-0.5">{item.subtitle}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs">
                  <span className="text-[#FFD700] font-medium">
                    {formatMoney(data?.revenue ?? 0)} revenue
                  </span>
                  <span className="text-[var(--portal-muted,#A8A8A8)]">
                    {data?.students ?? 0} users · {data?.total ?? 0} payments
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

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

      {/* Section stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: section === "course" ? "Course Revenue" : "Signal Revenue",
            value: formatMoney(sectionStats?.revenue ?? 0),
            color: section === "course" ? "text-[#FFD700]" : "text-blue-400",
            icon: DollarSign,
          },
          {
            label: "Completed",
            value: sectionStats?.completed ?? 0,
            color: "text-green-400",
            icon: CheckCircle2,
          },
          {
            label: "Pending",
            value: sectionStats?.pending ?? 0,
            color: "text-[#FFD700]",
            icon: Clock,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card p-3 sm:p-4">
              <Icon className="w-4 h-4 text-[#D4AF37] mb-2" />
              <p className={cn("font-numbers text-lg sm:text-xl font-bold", stat.color)}>
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--portal-muted-2,#666)] mt-0.5">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Record form + tips */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <sectionMeta.icon className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-heading text-lg font-semibold text-[var(--portal-fg,#fff)]">
              Record {section === "course" ? "Course" : "Signal"} Payment
            </h2>
          </div>
          <p className="text-[var(--portal-muted-2,#666)] text-xs sm:text-sm mb-5">
            {section === "course"
              ? "Log when a student enrols in Foundation, PRO, or ELITE"
              : "Log when a student buys a standalone signal plan"}
          </p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--portal-muted,#A8A8A8)] uppercase tracking-wider">
                {section === "course" ? "Course Student" : "Signal Subscriber"}
              </label>
              <select
                className="input-luxury w-full px-4 py-3 text-sm"
                value={form.student_id}
                onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
                required
              >
                <option value="">
                  {section === "course"
                    ? "Select course student..."
                    : "Select signal subscriber..."}
                </option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} (@{student.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-medium text-[var(--portal-muted,#A8A8A8)] uppercase tracking-wider">
                {section === "course" ? "Course Plan" : "Signal Plan"}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {planPresets.map((plan) => {
                  const active = form.plan_name === plan.name;
                  return (
                    <button
                      key={plan.name}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          plan_name: plan.name,
                          plan_type: plan.type,
                          amount: String(plan.amount),
                        }))
                      }
                      className={cn(
                        "flex flex-col items-start p-3 rounded-xl border text-left transition-all",
                        active
                          ? section === "course"
                            ? "bg-[#D4AF37]/12 border-[#D4AF37]/50"
                            : "bg-blue-500/12 border-blue-500/50"
                          : "border-[var(--portal-border,rgba(212,175,55,0.2))] hover:border-[#D4AF37]/30"
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          active
                            ? section === "course"
                              ? "text-[#FFD700]"
                              : "text-blue-400"
                            : "text-[var(--portal-fg,#fff)]"
                        )}
                      >
                        {plan.name}
                      </span>
                      <span className="font-numbers text-lg font-bold text-[#FFD700] mt-1">
                        ${plan.amount}
                      </span>
                    </button>
                  );
                })}
              </div>
              <Input
                label="Or enter custom plan name"
                value={form.plan_name}
                onChange={(e) => setForm((f) => ({ ...f, plan_name: e.target.value }))}
                placeholder={section === "course" ? "PRO, ELITE..." : "6 Months Signals..."}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Amount (USD)"
                type="number"
                min={1}
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="249"
                required
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--portal-muted,#A8A8A8)] uppercase tracking-wider">
                  Payment Method
                </label>
                <select
                  className="input-luxury w-full px-4 py-3 text-sm"
                  value={form.payment_method}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      payment_method: e.target.value as PaymentMethod,
                    }))
                  }
                >
                  {METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--portal-muted,#A8A8A8)] uppercase tracking-wider">
                  Status
                </label>
                <select
                  className="input-luxury w-full px-4 py-3 text-sm"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as PaymentStatus,
                    }))
                  }
                >
                  {STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Reference (optional)"
                value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                placeholder="UPI ref, txn ID..."
              />
            </div>

            <Input
              label="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Member code ELITE, discount applied..."
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button
                type="submit"
                variant="gold"
                size="md"
                disabled={saving || !form.student_id || !form.plan_name || !form.amount}
                className="w-full sm:w-auto min-h-[44px]"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Receipt className="w-4 h-4" />
                )}
                {saving
                  ? "Saving..."
                  : section === "course"
                    ? "Record Course Payment"
                    : "Record Signal Payment"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={saving}
                className="w-full sm:w-auto min-h-[44px]"
                onClick={() => {
                  setForm(emptyForm(section));
                  setError(null);
                }}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-4 sm:p-5 h-fit lg:sticky lg:top-24">
          <h3 className="font-heading text-sm font-semibold text-[var(--portal-fg,#fff)] flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-[#D4AF37]" />
            {section === "course" ? "Course Students" : "Signal Users"}
          </h3>
          <p className="text-xs text-[var(--portal-muted,#A8A8A8)] leading-relaxed mb-4">
            {section === "course"
              ? "Students who paid for Foundation, PRO, or ELITE appear here — separate from signal-only buyers."
              : "Users who bought signal plans only appear here — they may also have a course, but signal payments stay in this section."}
          </p>
          <div className="rounded-xl border border-[var(--portal-border,rgba(212,175,55,0.15))] p-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--portal-muted,#A8A8A8)]">Unique users</span>
              <span className="font-numbers text-[#FFD700]">{sectionStats?.students ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--portal-muted,#A8A8A8)]">Total payments</span>
              <span className="font-numbers text-[var(--portal-fg,#fff)]">
                {sectionStats?.total ?? 0}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--portal-muted,#A8A8A8)]">Section revenue</span>
              <span className="font-numbers text-green-400">
                {formatMoney(sectionStats?.revenue ?? 0)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Section payment history */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-[var(--portal-fg,#fff)] flex items-center gap-2">
              <sectionMeta.icon className="w-5 h-5 text-[#D4AF37]" />
              {section === "course" ? "Course Payment History" : "Signal Payment History"}
            </h2>
            <p className="text-xs text-[var(--portal-muted-2,#666)] mt-0.5">
              {sectionPayments.length} record{sectionPayments.length !== 1 ? "s" : ""} shown
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--portal-muted-2,#666)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  section === "course"
                    ? "Search course student..."
                    : "Search signal user..."
                }
                className="input-luxury w-full sm:w-52 pl-9 pr-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-1 p-1 rounded-xl bg-[var(--portal-bg-elevated,#101010)] border border-[var(--portal-border,rgba(212,175,55,0.15))] overflow-x-auto">
              {(["all", "completed", "pending", "refunded", "failed"] as const).map((tab) => (
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
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[var(--portal-muted,#A8A8A8)]">
            <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37] mr-2" />
            Loading {section === "course" ? "course" : "signal"} payments...
          </div>
        ) : sectionPayments.length === 0 ? (
          <div className="glass-card p-8 sm:p-10 text-center">
            <sectionMeta.icon className="w-10 h-10 text-[#D4AF37]/40 mx-auto mb-3" />
            <p className="text-[var(--portal-fg,#fff)] text-sm font-medium">
              {section === "course"
                ? "No course payments yet"
                : "No signal subscription payments yet"}
            </p>
            <p className="text-[var(--portal-muted-2,#666)] text-xs mt-1 max-w-sm mx-auto">
              {section === "course"
                ? "Record a Foundation, PRO, or ELITE enrolment using the form above"
                : "Record a signal plan purchase using the form above"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sectionPayments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                actionId={actionId}
                onComplete={(id) => updateStatus(id, "completed")}
                onRefund={(id) => updateStatus(id, "refunded")}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
