import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureAppDataLoaded } from "@/lib/data/ensure-data-loaded";
import { listMeetings } from "@/lib/data/meeting-store";
import { getUserPurchasedCourses } from "@/lib/user-courses";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureAppDataLoaded();
  const courses = await getUserPurchasedCourses(session.id);
  const hasProOrElite = courses.some(
    (course) => course.slug === "pro" || course.slug === "elite"
  );

  const now = new Date();
  const meetings = listMeetings().filter((meeting) => {
    if (meeting.status === "cancelled" || meeting.status === "completed") {
      return false;
    }
    if (meeting.audience === "pro_elite" && !hasProOrElite) {
      return false;
    }
    const end = new Date(meeting.scheduled_at);
    end.setMinutes(end.getMinutes() + meeting.duration_minutes);
    return end >= now || meeting.status === "live";
  });

  return NextResponse.json({ meetings });
}
