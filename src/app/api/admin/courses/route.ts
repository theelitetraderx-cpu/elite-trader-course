import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getPrograms, setPrograms, ensureProgramsLoaded } from "@/lib/data/course-content-store";
import type { CourseProgram } from "@/lib/data/course-hierarchy";

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  await ensureProgramsLoaded();
  return NextResponse.json({ programs: getPrograms() });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    if (!Array.isArray(body.programs)) {
      return NextResponse.json({ error: "Invalid programs data" }, { status: 400 });
    }

    const programs = body.programs as CourseProgram[];
    const saved = await setPrograms(programs);

    return NextResponse.json({ success: true, programs: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save courses";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
