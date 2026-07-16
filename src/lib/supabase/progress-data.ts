import type { ModuleProgressRecord } from "@/lib/data/progress-store";
import { createSupabaseAdmin } from "@/lib/supabase/client";
import { isSupabaseDataEnabled } from "@/lib/supabase/app-data";

function isEnabled() {
  return isSupabaseDataEnabled();
}

export async function fetchProgressFromSupabase(
  userId?: string
): Promise<ModuleProgressRecord[] | null> {
  if (!isEnabled()) return null;

  const supabase = createSupabaseAdmin();
  if (!supabase) return null;

  let query = supabase
    .from("app_module_progress")
    .select("user_id, course_id, module_id, completed, watch_time_seconds, completed_at, updated_at");

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) return null;

  return (data ?? []).map((row) => ({
    user_id: row.user_id,
    course_id: row.course_id,
    module_id: row.module_id,
    completed: row.completed,
    watch_time_seconds: row.watch_time_seconds ?? 0,
    completed_at: row.completed_at ?? undefined,
    updated_at: row.updated_at,
  }));
}

export async function upsertProgressToSupabase(
  record: ModuleProgressRecord
): Promise<boolean> {
  if (!isEnabled()) return false;

  const supabase = createSupabaseAdmin();
  if (!supabase) return false;

  const { error } = await supabase.from("app_module_progress").upsert(
    {
      user_id: record.user_id,
      course_id: record.course_id,
      module_id: record.module_id,
      completed: record.completed,
      watch_time_seconds: record.watch_time_seconds,
      completed_at: record.completed_at ?? null,
      updated_at: record.updated_at,
    },
    { onConflict: "user_id,module_id" }
  );

  return !error;
}
