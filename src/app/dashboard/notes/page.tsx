import { getSession } from "@/lib/auth";
import { getEnrolledPrograms } from "@/lib/user-courses";
import { StudentMaterials } from "@/components/student/student-materials";
import { ensureAppDataLoaded } from "@/lib/data/ensure-data-loaded";
import { reloadPrograms } from "@/lib/data/course-content-store";
import { Suspense } from "react";

function MaterialsLoading() {
  return (
    <div className="glass-card p-10 text-center text-[#A8A8A8] text-sm">
      Loading course content...
    </div>
  );
}

export default async function NotesPage() {
  const session = await getSession();
  if (!session) return null;

  await ensureAppDataLoaded();
  await reloadPrograms();
  const programs = getEnrolledPrograms(session.id);

  return (
    <Suspense fallback={<MaterialsLoading />}>
      <StudentMaterials programs={programs} />
    </Suspense>
  );
}
