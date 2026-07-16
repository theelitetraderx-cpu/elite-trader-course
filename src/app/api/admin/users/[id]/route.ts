import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { canManageStaffRoles, isPortalStaff, isSuperAdmin } from "@/lib/admin/roles";
import {
  deleteUser,
  getStoredUserById,
  isProtectedSuperAdmin,
  updateUser,
} from "@/lib/data/user-store";
import { createSupabaseAdmin } from "@/lib/supabase/client";
import { isSupabaseDataEnabled, setCourseIdsForUser } from "@/lib/supabase/app-data";
import { normalizeUsername } from "@/lib/normalize-username";
import type { UserRole } from "@/types";

const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  full_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(["super_admin", "admin", "moderator", "student"]).optional(),
  status: z.enum(["active", "suspended", "inactive"]).optional(),
  expiry_date: z.string().nullable().optional(),
  course_ids: z.array(z.string()).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

function assertStaffRoleAssignment(role: UserRole | undefined, actorRole: UserRole) {
  if (!role || role === "student") return null;
  if (!canManageStaffRoles(actorRole)) {
    return NextResponse.json(
      { error: "Only super admins can assign admin or super admin roles" },
      { status: 403 }
    );
  }
  return null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const roleError = assertStaffRoleAssignment(parsed.data.role, auth.session.role);
    if (roleError) return roleError;

    if (
      isProtectedSuperAdmin(id) &&
      parsed.data.role &&
      parsed.data.role !== "super_admin"
    ) {
      return NextResponse.json(
        { error: "The primary super admin role cannot be changed" },
        { status: 400 }
      );
    }

    if (isSupabaseDataEnabled()) {
      const supabase = createSupabaseAdmin();
      if (!supabase) {
        return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
      }

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      const data = parsed.data;

      if (data.username !== undefined) updates.username = normalizeUsername(data.username);
      if (data.full_name !== undefined) updates.full_name = data.full_name.trim();
      if (data.email !== undefined) updates.email = data.email.trim().toLowerCase();
      if (data.phone !== undefined) updates.phone = data.phone.trim() || null;
      if (data.role !== undefined) updates.role = data.role;
      if (data.status !== undefined) updates.status = data.status;
      if (data.expiry_date !== undefined) {
        updates.expiry_date = data.expiry_date || null;
      }

      const { data: user, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)
        .select(
          "id, username, full_name, email, phone, role, status, avatar_url, expiry_date, created_at, updated_at, last_login"
        )
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (data.course_ids !== undefined) {
        await setCourseIdsForUser(id, data.course_ids);
      }

      let courseIds = data.course_ids;
      if (courseIds === undefined) {
        const { data: access } = await supabase
          .from("app_course_access")
          .select("course_id")
          .eq("user_id", id);
        courseIds = (access ?? []).map((row) => row.course_id);
      }

      return NextResponse.json({
        user: { ...user, course_ids: courseIds },
      });
    }

    const user = updateUser(id, parsed.data);
    return NextResponse.json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const { id } = await context.params;

  if (auth.session.id === id) {
    return NextResponse.json(
      { error: "You cannot delete your own account while logged in" },
      { status: 400 }
    );
  }

  const target = getStoredUserById(id);
  if (target && isPortalStaff(target.role) && !isSuperAdmin(auth.session.role)) {
    return NextResponse.json(
      { error: "Only super admins can delete admin accounts" },
      { status: 403 }
    );
  }

  if (isProtectedSuperAdmin(id)) {
    return NextResponse.json(
      { error: "The primary super admin account cannot be deleted" },
      { status: 400 }
    );
  }

  try {
    if (isSupabaseDataEnabled()) {
      const supabase = createSupabaseAdmin();
      if (!supabase) {
        return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
      }

      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    if (isProtectedSuperAdmin(id)) {
      return NextResponse.json(
        { error: "The primary super admin account cannot be deleted" },
        { status: 400 }
      );
    }

    if (!getStoredUserById(id)) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
