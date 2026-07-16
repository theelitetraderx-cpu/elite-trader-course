import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureAppDataLoaded } from "@/lib/data/ensure-data-loaded";
import { listAnnouncements } from "@/lib/data/announcement-store";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureAppDataLoaded();
  return NextResponse.json({ announcements: listAnnouncements() });
}
