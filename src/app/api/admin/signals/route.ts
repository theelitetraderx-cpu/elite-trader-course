import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { ensureAppDataLoaded } from "@/lib/data/ensure-data-loaded";
import {
  createSignal,
  deleteSignal,
  listSignals,
  updateSignalStatus,
} from "@/lib/data/signal-store";

const createSchema = z.object({
  pair: z.string().min(2, "Pair is required"),
  direction: z.enum(["buy", "sell", "watch"]),
  entry: z.string().optional(),
  target: z.string().optional(),
  stop_loss: z.string().optional(),
  notes: z.string().optional(),
  notify_students: z.boolean().optional(),
});

const updateSchema = z.object({
  status: z.enum(["active", "closed", "cancelled"]),
});

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  await ensureAppDataLoaded();
  return NextResponse.json({ signals: listSignals() });
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
    const { signal, notifiedCount } = createSignal({
      ...parsed.data,
      created_by: auth.session.id,
      created_by_name: auth.session.full_name,
    });

    return NextResponse.json({ signal, notified_count: notifiedCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create signal";
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
      return NextResponse.json({ error: "Signal id is required" }, { status: 400 });
    }

    await ensureAppDataLoaded();
    const signal = updateSignalStatus(id, parsed.data.status);
    return NextResponse.json({ signal });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update signal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Signal id is required" }, { status: 400 });
  }

  try {
    await ensureAppDataLoaded();
    deleteSignal(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete signal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
