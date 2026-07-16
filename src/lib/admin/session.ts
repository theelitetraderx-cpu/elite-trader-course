import type { SessionUser } from "@/types";
import { getEffectivePermissions } from "@/lib/admin/permissions";
import { getStoredUserById } from "@/lib/data/user-store";

/** Sync role & permissions from persisted user — JWT may be stale after role changes. */
export function enrichSessionUser(session: SessionUser): SessionUser {
  const stored = getStoredUserById(session.id);
  if (!stored) return session;

  const permissions = getEffectivePermissions(stored);
  return {
    ...session,
    role: stored.role,
    full_name: stored.full_name,
    email: stored.email,
    avatar_url: stored.avatar_url,
    staff_permissions: permissions ?? undefined,
  };
}
