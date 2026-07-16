import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ensureAppDataLoaded } from "@/lib/data/ensure-data-loaded";
import {
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/data/notification-store";

const patchSchema = z.object({
  notification_id: z.string().optional(),
  mark_all: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureAppDataLoaded();
  return NextResponse.json({
    notifications: listNotificationsForUser(session.id),
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    if (parsed.data.mark_all) {
      const count = markAllNotificationsRead(session.id);
      return NextResponse.json({ success: true, updated: count });
    }

    if (!parsed.data.notification_id) {
      return NextResponse.json(
        { error: "notification_id or mark_all is required" },
        { status: 400 }
      );
    }

    const ok = markNotificationRead(session.id, parsed.data.notification_id);
    if (!ok) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update notifications";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
