"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const CourseHierarchyManager = dynamic(
  () =>
    import("@/components/admin/course-hierarchy-manager").then(
      (mod) => mod.CourseHierarchyManager
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20 text-[var(--portal-muted,#A8A8A8)]">
        <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37] mr-2" />
        Loading courses...
      </div>
    ),
  }
);

export function AdminCoursesClient() {
  return <CourseHierarchyManager />;
}
