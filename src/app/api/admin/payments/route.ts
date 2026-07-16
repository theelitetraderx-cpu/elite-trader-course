import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { ensureAppDataLoaded } from "@/lib/data/ensure-data-loaded";
import {
  createPayment,
  deletePayment,
  getPaymentStats,
  listPayments,
  updatePayment,
} from "@/lib/data/payment-store";

const createSchema = z.object({
  student_id: z.string().min(1, "Student is required"),
  student_name: z.string().min(1, "Student name is required"),
  student_email: z.string().email("Valid email is required"),
  plan_name: z.string().min(1, "Plan is required"),
  plan_type: z.enum(["course", "signal"]),
  amount: z.number().positive("Amount must be greater than zero"),
  currency: z.string().optional(),
  payment_method: z.enum([
    "upi",
    "bank_transfer",
    "paypal",
    "crypto",
    "stripe",
    "cash",
    "other",
  ]),
  status: z.enum(["completed", "pending", "refunded", "failed"]).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paid_at: z.string().optional(),
});

const updateSchema = z.object({
  plan_name: z.string().min(1).optional(),
  plan_type: z.enum(["course", "signal"]).optional(),
  amount: z.number().positive().optional(),
  payment_method: z
    .enum(["upi", "bank_transfer", "paypal", "crypto", "stripe", "cash", "other"])
    .optional(),
  status: z.enum(["completed", "pending", "refunded", "failed"]).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paid_at: z.string().optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  await ensureAppDataLoaded();
  return NextResponse.json({
    payments: listPayments(),
    stats: getPaymentStats(),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await ensureAppDataLoaded();
    const payment = createPayment({
      ...parsed.data,
      recorded_by: auth.session.id,
      recorded_by_name: auth.session.full_name,
    });

    return NextResponse.json({ payment, stats: getPaymentStats() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Payment id is required" }, { status: 400 });
    }

    await ensureAppDataLoaded();
    const payment = updatePayment(id, parsed.data);
    return NextResponse.json({ payment, stats: getPaymentStats() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Payment id is required" }, { status: 400 });
  }

  try {
    await ensureAppDataLoaded();
    deletePayment(id);
    return NextResponse.json({ success: true, stats: getPaymentStats() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
