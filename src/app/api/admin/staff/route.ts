import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  canCreateStaffRole,
  canManageStaffMember,
  defaultPermissionsForRole,
} from "@/lib/admin/permissions";
import { isSuperAdmin } from "@/lib/admin/roles";
import { ensureAppDataLoaded } from "@/lib/data/ensure-data-loaded";
import {
  createStaffUser,
  getStoredUserById,
  isProtectedSuperAdmin,
  listStaffUsers,
  updateStaffPermissions,
  updateUser,
} from "@/lib/data/user-store";
import type { StaffPermissions } from "@/types";

const permissionsSchema = z.object({
  manage_users: z.boolean(),
  manage_signals: z.boolean(),
  manage_meetings: z.boolean(),
  manage_courses: z.boolean(),
  manage_announcements: z.boolean(),
  view_payments: z.boolean(),
  view_analytics: z.boolean(),
  manage_staff: z.boolean(),
  max_students: z.number().int().min(0).nullable(),
});

const createSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  full_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["admin", "moderator"]),
  status: z.enum(["active", "suspended", "inactive"]).optional(),
  staff_permissions: permissionsSchema.optional(),
});

const updateSchema = z.object({
  status: z.enum(["active", "suspended", "inactive"]).optional(),
  staff_permissions: permissionsSchema.optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  if (!isSuperAdmin(auth.session.role) && auth.session.role !== "admin") {
    return NextResponse.json({ error: "Staff management access required" }, { status: 403 });
  }

  await ensureAppDataLoaded();

  let staff = listStaffUsers().filter((u) => u.role !== "super_admin");

  if (!isSuperAdmin(auth.session.role)) {
    staff = staff.filter((u) => u.role === "moderator");
  }

  return NextResponse.json({
    staff,
    actorRole: auth.session.role,
    canCreateAdmin: isSuperAdmin(auth.session.role),
  });
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

    if (!canCreateStaffRole(auth.session.role, parsed.data.role)) {
      return NextResponse.json(
        {
          error:
            parsed.data.role === "admin"
              ? "Only super admins can create admin accounts"
              : "You cannot create this staff role",
        },
        { status: 403 }
      );
    }

    await ensureAppDataLoaded();

    const permissions =
      parsed.data.staff_permissions ??
      defaultPermissionsForRole(parsed.data.role)!;

    if (auth.session.role === "admin") {
      permissions.manage_staff = false;
    }

    const user = createStaffUser({
      ...parsed.data,
      staff_permissions: permissions,
      managed_by: auth.session.id,
      status: parsed.data.status ?? "active",
    });

    return NextResponse.json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create staff member";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Staff id is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await ensureAppDataLoaded();
    const target = getStoredUserById(id);
    if (!target) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (isProtectedSuperAdmin(id)) {
      return NextResponse.json(
        { error: "The primary super admin cannot be modified here" },
        { status: 400 }
      );
    }

    if (!canManageStaffMember(auth.session.role, auth.session.id, target)) {
      return NextResponse.json(
        { error: "You cannot manage this staff member" },
        { status: 403 }
      );
    }

    let permissions: StaffPermissions | undefined = parsed.data.staff_permissions;
    if (permissions && auth.session.role === "admin") {
      permissions = { ...permissions, manage_staff: false };
    }

    if (parsed.data.status !== undefined) {
      updateUser(id, { status: parsed.data.status });
    }

    if (permissions) {
      const user = updateStaffPermissions(id, permissions);
      return NextResponse.json({ user });
    }

    const user = getStoredUserById(id);
    const { password_hash: _, ...rest } = user!;
    return NextResponse.json({ user: { ...rest, course_ids: user!.course_ids } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update staff member";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
