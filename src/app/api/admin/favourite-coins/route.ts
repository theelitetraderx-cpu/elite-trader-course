import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { ensureAppDataLoaded } from "@/lib/data/ensure-data-loaded";
import {
  addFavouriteCoin,
  deleteFavouriteCoin,
  listFavouriteCoins,
  setFavouriteCoinPublished,
} from "@/lib/data/favourite-coins-store";

const createSchema = z.object({
  pair: z.string().min(2, "Pair is required"),
  label: z.string().optional(),
});

const patchSchema = z.object({
  published: z.boolean(),
  notify_students: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  await ensureAppDataLoaded();
  return NextResponse.json({ coins: listFavouriteCoins() });
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
    const coin = addFavouriteCoin(parsed.data.pair, parsed.data.label);
    return NextResponse.json({ coin });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add coin";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Coin id is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await ensureAppDataLoaded();
    const coin = setFavouriteCoinPublished(
      id,
      parsed.data.published,
      parsed.data.notify_students ?? true
    );
    return NextResponse.json({ coin });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update coin";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Coin id is required" }, { status: 400 });
  }

  try {
    await ensureAppDataLoaded();
    deleteFavouriteCoin(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete coin";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
