import type { StaffPermissions, UserRole } from "@/types";
import { isSuperAdmin } from "@/lib/admin/roles";

export const FULL_STAFF_PERMISSIONS: StaffPermissions = {
  manage_users: true,
  manage_signals: true,
  manage_meetings: true,
  manage_courses: true,
  manage_announcements: true,
  view_payments: true,
  view_analytics: true,
  manage_staff: true,
  max_students: null,
};

export const DEFAULT_MODERATOR_PERMISSIONS: StaffPermissions = {
  manage_users: false,
  manage_signals: true,
  manage_meetings: true,
  manage_courses: false,
  manage_announcements: false,
  view_payments: false,
  view_analytics: false,
  manage_staff: false,
  max_students: 25,
};

export const PERMISSION_LABELS: {
  key: keyof StaffPermissions;
  label: string;
  hint: string;
  limitOnly?: boolean;
}[] = [
  {
    key: "manage_users",
    label: "Manage Students",
    hint: "Create and edit student accounts",
  },
  {
    key: "manage_signals",
    label: "Trading Signals",
    hint: "Publish and manage signals",
  },
  {
    key: "manage_meetings",
    label: "Live Meetings",
    hint: "Schedule live sessions",
  },
  {
    key: "manage_courses",
    label: "Courses & Content",
    hint: "Edit modules, videos, slides",
  },
  {
    key: "manage_announcements",
    label: "Announcements",
    hint: "Send messages to all students",
  },
  {
    key: "view_payments",
    label: "Payment History",
    hint: "View enrolment payments",
  },
  {
    key: "view_analytics",
    label: "Analytics",
    hint: "View platform stats",
  },
  {
    key: "manage_staff",
    label: "Manage Moderators",
    hint: "Create moderators (admin only)",
  },
  {
    key: "max_students",
    label: "Student Limit",
    hint: "Max students they can add",
    limitOnly: true,
  },
];

const ROUTE_PERMISSION: Record<string, keyof StaffPermissions | null> = {
  "/admin": null,
  "/admin/users": "manage_users",
  "/admin/meetings": "manage_meetings",
  "/admin/courses": "manage_courses",
  "/admin/payments": "view_payments",
};

export function defaultPermissionsForRole(role: UserRole): StaffPermissions | undefined {
  if (role === "admin") return { ...FULL_STAFF_PERMISSIONS };
  if (role === "moderator") return { ...DEFAULT_MODERATOR_PERMISSIONS };
  return undefined;
}

export function getEffectivePermissions(user: {
  role: UserRole;
  staff_permissions?: StaffPermissions;
}): StaffPermissions | null {
  if (isSuperAdmin(user.role)) return null;
  if (user.staff_permissions) return user.staff_permissions;
  return defaultPermissionsForRole(user.role) ?? null;
}

export function hasPermission(
  role: UserRole,
  permissions: StaffPermissions | null | undefined,
  key: keyof StaffPermissions
): boolean {
  if (isSuperAdmin(role)) return true;
  if (!permissions) return false;
  if (key === "max_students") return true;
  return Boolean(permissions[key]);
}

export function canAccessAdminPath(
  role: UserRole,
  permissions: StaffPermissions | null | undefined,
  pathname: string
): boolean {
  if (isSuperAdmin(role)) return true;

  const matched = Object.entries(ROUTE_PERMISSION)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([route]) => pathname === route || pathname.startsWith(`${route}/`));

  const permKey = matched?.[1];
  if (!permKey) return true;
  return hasPermission(role, permissions, permKey);
}

export function permissionForNavHref(href: string): keyof StaffPermissions | null {
  return ROUTE_PERMISSION[href] ?? null;
}

export function canManageStaffMember(
  actorRole: UserRole,
  actorId: string,
  target: { role: UserRole; managed_by?: string }
): boolean {
  if (isSuperAdmin(actorRole)) return target.role !== "super_admin";
  if (actorRole === "admin") return target.role === "moderator";
  return false;
}

export function canCreateStaffRole(actorRole: UserRole, targetRole: UserRole): boolean {
  if (isSuperAdmin(actorRole)) {
    return targetRole === "admin" || targetRole === "moderator";
  }
  if (actorRole === "admin") return targetRole === "moderator";
  return false;
}
