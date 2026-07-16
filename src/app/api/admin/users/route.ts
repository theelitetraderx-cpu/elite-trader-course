import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { canManageStaffRoles, isAdminRole } from "@/lib/admin/roles";
import { createUser, listUsers, getStoredUserById, isProtectedSuperAdmin } from "@/lib/data/user-store";
import { createSupabaseAdmin } from "@/lib/supabase/client";
import { isSupabaseDataEnabled } from "@/lib/supabase/app-data";
import { fetchAllCourseAccess, setCourseIdsForUser } from "@/lib/supabase/app-data";
import { hashPassword } from "@/lib/auth";
import { normalizeUsername } from "@/lib/normalize-username";
import type { UserRole } from "@/types";

const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  role: z.enum(["super_admin", "admin", "moderator", "student"]).optional(),
  status: z.enum(["active", "suspended", "inactive"]).optional(),
  expiry_date: z.string().optional(),
  course_ids: z.array(z.string()).optional(),
});

function assertStaffRoleAssignment(role: UserRole | undefined, actorRole: UserRole) {
  if (!role || role === "student") return null;
  if (!canManageStaffRoles(actorRole)) {
    return NextResponse.json(
      { error: "Only super admins can create admin or super admin accounts" },
      { status: 403 }
    );
  }
  return null;
}

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  if (isSupabaseDataEnabled()) {
    const supabase = createSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ users: listUsers() });
    }

    const { data: users, error } = await supabase
      .from("users")
      .select(
        "id, username, full_name, email, phone, role, status, avatar_url, expiry_date, created_at, updated_at, last_login"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const courseMap = await fetchAllCourseAccess();

    const enriched = (users ?? []).map((u) => ({
      ...u,
      course_ids: courseMap.get(u.id) ?? [],
    }));

    return NextResponse.json({ users: enriched });
  }

  return NextResponse.json({ users: listUsers() });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const roleError = assertStaffRoleAssignment(data.role, auth.session.role);
    if (roleError) return roleError;

    if (isSupabaseDataEnabled()) {
      const supabase = createSupabaseAdmin();
      if (!supabase) {
        const user = createUser({
          ...data,
          username: normalizeUsername(data.username),
        });
        return NextResponse.json({ user });
      }

      const password_hash = await hashPassword(data.password);
      const normalizedUsername = normalizeUsername(data.username);
      const { data: user, error } = await supabase
        .from("users")
        .insert({
          username: normalizedUsername,
          password_hash,
          full_name: data.full_name.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone?.trim() || null,
          role: data.role ?? "student",
          status: data.status ?? "active",
          expiry_date: data.expiry_date || null,
        })
        .select(
          "id, username, full_name, email, phone, role, status, avatar_url, expiry_date, created_at, updated_at, last_login"
        )
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (data.course_ids?.length) {
        await setCourseIdsForUser(user.id, data.course_ids);
      }

      return NextResponse.json({
        user: { ...user, course_ids: data.course_ids ?? [] },
      });
    }

    const user = createUser({
      ...data,
      username: normalizeUsername(data.username),
    });
    return NextResponse.json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
