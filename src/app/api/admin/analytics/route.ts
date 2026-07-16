import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getPlatformAnalytics } from "@/lib/analytics/platform-stats";
import { ensureAppDataLoaded } from "@/lib/data/ensure-data-loaded";

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  await ensureAppDataLoaded();
  const analytics = await getPlatformAnalytics();
  return NextResponse.json({ analytics });
}
