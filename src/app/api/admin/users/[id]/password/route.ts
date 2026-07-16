import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getStoredUserById, updateUserPassword } from "@/lib/data/user-store";
import { createSupabaseAdmin } from "@/lib/supabase/client";
import { isSupabaseDataEnabled } from "@/lib/supabase/app-data";
import { hashPassword } from "@/lib/auth";

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    if (isSupabaseDataEnabled()) {
      const supabase = createSupabaseAdmin();
      if (supabase) {
        const password_hash = await hashPassword(parsed.data.password);
        const { error } = await supabase
          .from("users")
          .update({ password_hash, updated_at: new Date().toISOString() })
          .eq("id", id);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
      }
    }

    if (!getStoredUserById(id)) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    updateUserPassword(id, parsed.data.password);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update password";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
