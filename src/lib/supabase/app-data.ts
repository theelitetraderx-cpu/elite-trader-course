import type { CourseProgram } from "@/lib/data/course-hierarchy";
import { getInitialPrograms } from "@/lib/data/course-hierarchy";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client";

const PROGRAMS_ROW_ID = "programs";

export function isSupabaseDataEnabled() {
  return (
    isSupabaseConfigured &&
    Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
    )
  );
}

export async function fetchProgramsFromSupabase(): Promise<CourseProgram[] | null> {
  if (!isSupabaseDataEnabled()) return null;

  const supabase = createSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("app_course_programs")
    .select("programs")
    .eq("id", PROGRAMS_ROW_ID)
    .maybeSingle();

  if (error || !data?.programs) return null;
  return data.programs as CourseProgram[];
}

export async function saveProgramsToSupabase(programs: CourseProgram[]): Promise<boolean> {
  if (!isSupabaseDataEnabled()) return false;

  const supabase = createSupabaseAdmin();
  if (!supabase) return false;

  const { error } = await supabase.from("app_course_programs").upsert(
    {
      id: PROGRAMS_ROW_ID,
      programs,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  return !error;
}

export async function seedProgramsIfEmpty(): Promise<void> {
  if (!isSupabaseDataEnabled()) return;

  const existing = await fetchProgramsFromSupabase();
  if (existing?.length) return;

  await saveProgramsToSupabase(getInitialPrograms());
}

export async function fetchCourseIdsForUser(userId: string): Promise<string[] | null> {
  if (!isSupabaseDataEnabled()) return null;

  const supabase = createSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("app_course_access")
    .select("course_id")
    .eq("user_id", userId);

  if (error) return null;
  return (data ?? []).map((row) => row.course_id);
}

export async function setCourseIdsForUser(
  userId: string,
  courseIds: string[]
): Promise<boolean> {
  if (!isSupabaseDataEnabled()) return false;

  const supabase = createSupabaseAdmin();
  if (!supabase) return false;

  await supabase.from("app_course_access").delete().eq("user_id", userId);

  if (courseIds.length === 0) return true;

  const { error } = await supabase.from("app_course_access").insert(
    courseIds.map((course_id) => ({ user_id: userId, course_id }))
  );

  return !error;
}

export async function fetchAllCourseAccess(): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!isSupabaseDataEnabled()) return map;

  const supabase = createSupabaseAdmin();
  if (!supabase) return map;

  const { data } = await supabase.from("app_course_access").select("user_id, course_id");
  for (const row of data ?? []) {
    const list = map.get(row.user_id) ?? [];
    list.push(row.course_id);
    map.set(row.user_id, list);
  }
  return map;
}
