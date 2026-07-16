import { getSession } from "@/lib/auth";
import { countUserMaterials } from "@/lib/user-courses";
import { getUserProgressStats, getCourseProgressPercent } from "@/lib/data/progress-store";
import { listMeetings } from "@/lib/data/meeting-store";
import { getUserCourseIds } from "@/lib/data/user-store";
import { buildStudentPlanViews } from "@/lib/student/build-plan-views";
import { ensureAppDataLoaded } from "@/lib/data/ensure-data-loaded";
import { reloadPrograms } from "@/lib/data/course-content-store";
import { StudentDashboard } from "@/components/student/student-dashboard";

export default async function StudentWelcomePage() {
  const session = await getSession();
  if (!session) return null;

  await ensureAppDataLoaded();
  await reloadPrograms();

  const userCourseIds = getUserCourseIds(session.id);
  const planViews = buildStudentPlanViews(userCourseIds);
  const unlockedCourseIds = planViews.filter((p) => p.unlocked).map((p) => p.course.id);

  const materials = countUserMaterials(session.id);
  const progressStats = getUserProgressStats(session.id);
  const courseProgress = Object.fromEntries(
    unlockedCourseIds.map((id) => [id, getCourseProgressPercent(session.id, id)])
  );

  const hasProOrElite = userCourseIds.some(
    (id) => id === "course-pro" || id === "course-elite"
  );

  const now = new Date();
  const meetings = listMeetings().filter((meeting) => {
    if (meeting.status === "cancelled" || meeting.status === "completed") return false;
    if (meeting.audience === "pro_elite" && !hasProOrElite) return false;
    const end = new Date(meeting.scheduled_at);
    end.setMinutes(end.getMinutes() + meeting.duration_minutes);
    return end >= now || meeting.status === "live";
  });

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <StudentDashboard
      fullName={session.full_name}
      username={session.username}
      greeting={greeting}
      planViews={planViews}
      userCourseIds={userCourseIds}
      meetings={meetings}
      materialsCount={materials.notes + materials.ppts + materials.videos}
      progressStats={progressStats}
      courseProgress={courseProgress}
    />
  );
}
