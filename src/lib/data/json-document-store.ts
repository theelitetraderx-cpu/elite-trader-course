import { createSupabaseAdmin } from "@/lib/supabase/client";
import { isSupabaseDataEnabled } from "@/lib/supabase/app-data";

/**
 * Generic JSON document bag in Supabase for serverless durability
 * (meetings, payments, etc.). Requires app_json_documents table.
 */
export async function fetchJsonDocument<T>(id: string): Promise<T | null> {
  if (!isSupabaseDataEnabled()) return null;

  try {
    const supabase = createSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("app_json_documents")
      .select("data")
      .eq("id", id)
      .maybeSingle();

    if (error || data?.data === undefined || data?.data === null) return null;
    return data.data as T;
  } catch (err) {
    console.warn(`[json-doc] fetch ${id} failed:`, err);
    return null;
  }
}

export async function saveJsonDocument<T>(id: string, data: T): Promise<boolean> {
  if (!isSupabaseDataEnabled()) return false;

  try {
    const supabase = createSupabaseAdmin();
    if (!supabase) return false;

    const { error } = await supabase.from("app_json_documents").upsert(
      {
        id,
        data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.warn(`[json-doc] save ${id} failed:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[json-doc] save ${id} failed:`, err);
    return false;
  }
}
