import type { UserRole } from "@/types";

/** Any role that uses the admin portal (including moderators). */
export function isPortalStaff(role: UserRole | string): boolean {
  return role === "super_admin" || role === "admin" || role === "moderator";
}

/** @deprecated Use isPortalStaff — kept for middleware compatibility */
export function isAdminRole(role: UserRole | string): boolean {
  return isPortalStaff(role);
}

export function isFullAdmin(role: UserRole | string): boolean {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdmin(role: UserRole | string): boolean {
  return role === "super_admin";
}

export function canManageStaffRoles(role: UserRole | string): boolean {
  return role === "super_admin" || role === "admin";
}

export function roleLabel(role: UserRole): string {
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Admin";
  if (role === "moderator") return "Moderator";
  return "Student";
}
