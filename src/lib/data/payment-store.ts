import { readJsonFile, writeJsonFile } from "@/lib/data/persist";
import { fetchJsonDocument, saveJsonDocument } from "@/lib/data/json-document-store";
import type {
  PaymentMethod,
  PaymentPlanType,
  PaymentRecord,
  PaymentStatus,
} from "@/types";

const PAYMENTS_FILE = "payments.json";
const REMOTE_DOC_ID = "payments";

declare global {
  // eslint-disable-next-line no-var
  var __elitePaymentStore: PaymentRecord[] | undefined;
  // eslint-disable-next-line no-var
  var __elitePaymentsHydrated: boolean | undefined;
}

const DEMO_PAYMENT_IDS = new Set([
  "pay-seed-001",
  "pay-seed-002",
  "pay-seed-003",
  "pay-seed-004",
]);

const DEMO_STUDENT_IDS = new Set(["student-001", "student-002"]);

function stripDemoPayments(payments: PaymentRecord[]): PaymentRecord[] {
  const demoEmails = new Set([
    "student@elitetrader.in",
    "student@elitetrader.com",
    "sarah@example.com",
  ]);
  return payments.filter(
    (p) =>
      !DEMO_PAYMENT_IDS.has(p.id) &&
      !DEMO_STUDENT_IDS.has(p.student_id) &&
      !demoEmails.has(p.student_email.toLowerCase())
  );
}

function loadStore(): PaymentRecord[] {
  const stored = readJsonFile<PaymentRecord[]>(PAYMENTS_FILE);
  if (stored) {
    const cleaned = stripDemoPayments(stored);
    if (cleaned.length !== stored.length) {
      writeJsonFile(PAYMENTS_FILE, cleaned);
    }
    return cleaned;
  }
  writeJsonFile(PAYMENTS_FILE, []);
  return [];
}

function getStore(): PaymentRecord[] {
  if (!global.__elitePaymentStore) {
    global.__elitePaymentStore = loadStore();
  }
  return global.__elitePaymentStore;
}

function saveStore() {
  const data = getStore();
  writeJsonFile(PAYMENTS_FILE, data);
  void saveJsonDocument(REMOTE_DOC_ID, data);
}

export function uid(prefix = "pay") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function ensurePaymentsLoaded(): Promise<void> {
  if (global.__elitePaymentsHydrated && global.__elitePaymentStore) return;

  const local = loadStore();
  const remote = await fetchJsonDocument<PaymentRecord[]>(REMOTE_DOC_ID);
  const remoteClean = remote ? stripDemoPayments(remote) : null;

  if (remoteClean && remoteClean.length >= local.length) {
    global.__elitePaymentStore = remoteClean;
    writeJsonFile(PAYMENTS_FILE, remoteClean);
    if (remote && remoteClean.length !== remote.length) {
      void saveJsonDocument(REMOTE_DOC_ID, remoteClean);
    }
  } else {
    global.__elitePaymentStore = local;
    void saveJsonDocument(REMOTE_DOC_ID, local);
  }

  global.__elitePaymentsHydrated = true;
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
