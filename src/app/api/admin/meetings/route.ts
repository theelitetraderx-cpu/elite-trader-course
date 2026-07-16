import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { ensureAppDataLoaded } from "@/lib/data/ensure-data-loaded";
import {
  createMeeting,
  deleteMeeting,
  listMeetings,
  updateMeeting,
} from "@/lib/data/meeting-store";

const createSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  meeting_url: z
    .string()
    .min(1, "Meeting link is required")
    .refine(
      (value) =>
        /^https?:\/\//i.test(value.trim()) ||
        /^t\.me\//i.test(value.trim()) ||
        value.trim().startsWith("www."),
      "Enter a valid meeting link (https://...)"
    ),
  scheduled_at: z.string().min(1, "Schedule date/time is required"),
  duration_minutes: z.number().min(15).max(480).optional(),
  audience: z.enum(["all", "pro_elite"]).optional(),
  notify_students: z.boolean().optional(),
});

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  meeting_url: z.string().min(1).optional(),
  scheduled_at: z.string().optional(),
  duration_minutes: z.number().min(15).max(480).optional(),
  audience: z.enum(["all", "pro_elite"]).optional(),
  status: z.enum(["scheduled", "live", "completed", "cancelled"]).optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  await ensureAppDataLoaded();
  return NextResponse.json({ meetings: listMeetings() });
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
    let meetingUrl = parsed.data.meeting_url.trim();
    if (!/^https?:\/\//i.test(meetingUrl)) {
      meetingUrl = `https://${meetingUrl.replace(/^\/\//, "")}`;
    }

    const { meeting, notifiedCount } = createMeeting({
      ...parsed.data,
      meeting_url: meetingUrl,
      created_by: auth.session.id,
      created_by_name: auth.session.full_name,
    });

    return NextResponse.json({ meeting, notified_count: notifiedCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create meeting";
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
      return NextResponse.json({ error: "Meeting id is required" }, { status: 400 });
    }

    await ensureAppDataLoaded();
    const meeting = updateMeeting(id, parsed.data);
    return NextResponse.json({ meeting });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update meeting";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Meeting id is required" }, { status: 400 });
  }

  try {
    await ensureAppDataLoaded();
    deleteMeeting(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete meeting";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
