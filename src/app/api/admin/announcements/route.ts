import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { ensureAppDataLoaded } from "@/lib/data/ensure-data-loaded";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
} from "@/lib/data/announcement-store";

const createSchema = z.object({
  title: z.string().min(2, "Title is required"),
  message: z.string().min(2, "Message is required"),
  priority: z.enum(["normal", "important"]).optional(),
  notify_students: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  await ensureAppDataLoaded();
  return NextResponse.json({ announcements: listAnnouncements() });
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
    const { announcement, notifiedCount } = createAnnouncement({
      ...parsed.data,
      created_by: auth.session.id,
      created_by_name: auth.session.full_name,
    });

    return NextResponse.json({
      announcement,
      notified_count: notifiedCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send announcement";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Announcement id is required" }, { status: 400 });
  }

  try {
    await ensureAppDataLoaded();
    const deleted = deleteAnnouncement(id);
    if (!deleted) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete announcement";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
