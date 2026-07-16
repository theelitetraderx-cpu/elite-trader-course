import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { isPortalStaff, isSuperAdmin } from "@/lib/admin/roles";
import { enrichSessionUser } from "@/lib/admin/session";
import { ensureAppDataLoaded } from "@/lib/data/ensure-data-loaded";

export async function requireAdmin(): Promise<
  { session: SessionUser } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  await ensureAppDataLoaded();
  const enriched = enrichSessionUser(session);

  if (!isPortalStaff(enriched.role)) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session: enriched };
}

export async function requireSuperAdmin(): Promise<
  { session: SessionUser } | { response: NextResponse }
> {
  const auth = await requireAdmin();
  if ("response" in auth) return auth;

  if (!isSuperAdmin(auth.session.role)) {
    return {
      response: NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      ),
    };
  }

  return auth;
}
