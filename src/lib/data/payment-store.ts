import { readJsonFile, writeJsonFile } from "@/lib/data/persist";
import type {
  PaymentMethod,
  PaymentPlanType,
  PaymentRecord,
  PaymentStatus,
} from "@/types";

const PAYMENTS_FILE = "payments.json";

declare global {
  // eslint-disable-next-line no-var
  var __elitePaymentStore: PaymentRecord[] | undefined;
}

const SEED_PAYMENTS: PaymentRecord[] = [
  {
    id: "pay-seed-001",
    student_id: "student-001",
    student_name: "John Trader",
    student_email: "student@elitetrader.in",
    plan_name: "PRO",
    plan_type: "course",
    amount: 249,
    currency: "USD",
    payment_method: "upi",
    status: "completed",
    reference: "UPI-7829341056",
    notes: "Member code ELITE applied",
    recorded_by: "admin-001",
    recorded_by_name: "Elite Admin",
    paid_at: "2025-06-05T10:30:00.000Z",
    created_at: "2025-06-05T10:35:00.000Z",
  },
  {
    id: "pay-seed-002",
    student_id: "student-002",
    student_name: "Sarah Williams",
    student_email: "sarah@example.com",
    plan_name: "ELITE",
    plan_type: "course",
    amount: 499,
    currency: "USD",
    payment_method: "bank_transfer",
    status: "completed",
    reference: "WIRE-20250815-4421",
    recorded_by: "admin-001",
    recorded_by_name: "Elite Admin",
    paid_at: "2025-08-15T14:00:00.000Z",
    created_at: "2025-08-15T14:05:00.000Z",
  },
  {
    id: "pay-seed-003",
    student_id: "student-001",
    student_name: "John Trader",
    student_email: "student@elitetrader.in",
    plan_name: "3 Months Signals",
    plan_type: "signal",
    amount: 70,
    currency: "USD",
    payment_method: "paypal",
    status: "completed",
    reference: "PP-9XK7721",
    recorded_by: "admin-001",
    recorded_by_name: "Elite Admin",
    paid_at: "2026-01-12T09:15:00.000Z",
    created_at: "2026-01-12T09:20:00.000Z",
  },
  {
    id: "pay-seed-004",
    student_id: "student-002",
    student_name: "Sarah Williams",
    student_email: "sarah@example.com",
    plan_name: "Lifetime Signals",
    plan_type: "signal",
    amount: 299,
    currency: "USD",
    payment_method: "crypto",
    status: "pending",
    reference: "BTC-tx-pending",
    notes: "Awaiting blockchain confirmation",
    recorded_by: "admin-001",
    recorded_by_name: "Elite Admin",
    paid_at: "2026-07-10T11:00:00.000Z",
    created_at: "2026-07-10T11:00:00.000Z",
  },
];

function loadStore(): PaymentRecord[] {
  const stored = readJsonFile<PaymentRecord[]>(PAYMENTS_FILE);
  if (stored && stored.length > 0) return stored;
  writeJsonFile(PAYMENTS_FILE, SEED_PAYMENTS);
  return SEED_PAYMENTS;
}

function getStore(): PaymentRecord[] {
  if (!global.__elitePaymentStore) {
    global.__elitePaymentStore = loadStore();
  }
  return global.__elitePaymentStore;
}

function saveStore() {
  writeJsonFile(PAYMENTS_FILE, getStore());
}

export function uid(prefix = "pay") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function ensurePaymentsLoaded(): Promise<void> {
  if (!global.__elitePaymentStore) {
    global.__elitePaymentStore = loadStore();
  }
}

export function listPayments(): PaymentRecord[] {
  return [...getStore()].sort((a, b) => b.paid_at.localeCompare(a.paid_at));
}

export function getPaymentById(id: string): PaymentRecord | null {
  return getStore().find((payment) => payment.id === id) ?? null;
}

export interface CreatePaymentInput {
  student_id: string;
  student_name: string;
  student_email: string;
  plan_name: string;
  plan_type: PaymentPlanType;
  amount: number;
  currency?: string;
  payment_method: PaymentMethod;
  status?: PaymentStatus;
  reference?: string;
  notes?: string;
  paid_at?: string;
  recorded_by: string;
  recorded_by_name: string;
}

export function createPayment(input: CreatePaymentInput): PaymentRecord {
  const now = new Date().toISOString();
  const payment: PaymentRecord = {
    id: uid(),
    student_id: input.student_id,
    student_name: input.student_name.trim(),
    student_email: input.student_email.trim(),
    plan_name: input.plan_name.trim(),
    plan_type: input.plan_type,
    amount: input.amount,
    currency: input.currency ?? "USD",
    payment_method: input.payment_method,
    status: input.status ?? "completed",
    reference: input.reference?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    recorded_by: input.recorded_by,
    recorded_by_name: input.recorded_by_name,
    paid_at: input.paid_at ?? now,
    created_at: now,
  };

  getStore().unshift(payment);
  saveStore();
  return payment;
}

export function updatePayment(
  id: string,
  input: Partial<
    Pick<
      PaymentRecord,
      | "plan_name"
      | "plan_type"
      | "amount"
      | "payment_method"
      | "status"
      | "reference"
      | "notes"
      | "paid_at"
    >
  >
): PaymentRecord {
  const payment = getStore().find((item) => item.id === id);
  if (!payment) throw new Error("Payment not found");

  if (input.plan_name !== undefined) payment.plan_name = input.plan_name.trim();
  if (input.plan_type !== undefined) payment.plan_type = input.plan_type;
  if (input.amount !== undefined) payment.amount = input.amount;
  if (input.payment_method !== undefined) payment.payment_method = input.payment_method;
  if (input.status !== undefined) payment.status = input.status;
  if (input.reference !== undefined) {
    payment.reference = input.reference.trim() || undefined;
  }
  if (input.notes !== undefined) payment.notes = input.notes.trim() || undefined;
  if (input.paid_at !== undefined) payment.paid_at = input.paid_at;

  saveStore();
  return payment;
}

export function deletePayment(id: string): void {
  const store = getStore();
  const index = store.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Payment not found");
  store.splice(index, 1);
  saveStore();
}

function statsForType(payments: PaymentRecord[], planType: PaymentPlanType) {
  const subset = payments.filter((p) => p.plan_type === planType);
  const completed = subset.filter((p) => p.status === "completed");
  const pending = subset.filter((p) => p.status === "pending");
  const uniqueStudents = new Set(subset.map((p) => p.student_id)).size;

  return {
    total: subset.length,
    completed: completed.length,
    pending: pending.length,
    revenue: completed.reduce((sum, p) => sum + p.amount, 0),
    students: uniqueStudents,
  };
}

export function getPaymentStats() {
  const payments = listPayments();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const completed = payments.filter((p) => p.status === "completed");
  const pending = payments.filter((p) => p.status === "pending");
  const refunded = payments.filter((p) => p.status === "refunded");

  const totalRevenue = completed.reduce((sum, p) => sum + p.amount, 0);
  const monthRevenue = completed
    .filter((p) => p.paid_at >= monthStart)
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    total: payments.length,
    completed: completed.length,
    pending: pending.length,
    refunded: refunded.length,
    totalRevenue,
    monthRevenue,
    course: statsForType(payments, "course"),
    signal: statsForType(payments, "signal"),
  };
}
