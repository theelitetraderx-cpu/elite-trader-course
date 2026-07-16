import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  addWatchTime,
  getUserProgress,
  getUserProgressStats,
  markModuleComplete,
} from "@/lib/data/progress-store";
import { getEnrolledPrograms } from "@/lib/course-content";
import { ensureAppDataLoaded } from "@/lib/data/ensure-data-loaded";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureAppDataLoaded();
  const progress = getUserProgress(session.id);
  const stats = getUserProgressStats(session.id);

  const courseProgress = getEnrolledPrograms(session.id).map((program) => {
    const published = program.modules.filter(
      (mod) =>
        mod.videos.length > 0 || mod.ppts.length > 0 || mod.notes.length > 0
    );
    const completed = published.filter((mod) =>
      progress.some((record) => record.module_id === mod.id && record.completed)
    ).length;

    return {
      course_id: program.id,
      title: program.title,
      completed_modules: completed,
      total_modules: published.length,
      percent: published.length
        ? Math.round((completed / published.length) * 100)
        : 0,
    };
  });

  return NextResponse.json({ progress, stats, courseProgress });
}

const progressSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("complete_module"),
    course_id: z.string().min(1),
    module_id: z.string().min(1),
  }),
  z.object({
    action: z.literal("watch_time"),
    course_id: z.string().min(1),
    module_id: z.string().min(1),
    seconds: z.number().min(1).max(3600),
  }),
]);

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = progressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await ensureAppDataLoaded();
    const enrolled = getEnrolledPrograms(session.id);
    const data = parsed.data;

    const program = enrolled.find((item) => item.id === data.course_id);
    if (!program) {
      return NextResponse.json({ error: "Course not enrolled" }, { status: 403 });
    }

    const moduleExists = program.modules.some((mod) => mod.id === data.module_id);
    if (!moduleExists) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    if (data.action === "complete_module") {
      const record = markModuleComplete(session.id, data.course_id, data.module_id);
      return NextResponse.json({ success: true, record, stats: getUserProgressStats(session.id) });
    }

    const record = addWatchTime(
      session.id,
      data.course_id,
      data.module_id,
      data.seconds
    );
    return NextResponse.json({ success: true, record, stats: getUserProgressStats(session.id) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update progress";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
