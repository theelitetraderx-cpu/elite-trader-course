import { readdir, stat } from "fs/promises";
import path from "path";
import { getPrograms } from "@/lib/data/course-content-store";
import { listUsers } from "@/lib/data/user-store";
import { DEMO_COURSES } from "@/lib/data/demo-data";
import {
  getPlatformCompletionRate,
  getTotalWatchTimeSeconds,
} from "@/lib/data/progress-store";
import type { AnalyticsOverview } from "@/types";
import { LEGACY_PUBLIC_UPLOADS, PRIVATE_UPLOADS } from "@/lib/upload/storage-path";

async function directorySize(dir: string): Promise<number> {
  let total = 0;
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        total += await directorySize(fullPath);
      } else if (entry.isFile()) {
        const fileStat = await stat(fullPath);
        total += fileStat.size;
      }
    }
  } catch {
    // Directory may not exist yet
  }
  return total;
}

function isToday(isoDate?: string) {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isWithinDays(isoDate: string | undefined, days: number) {
  if (!isoDate) return false;
  const date = new Date(isoDate).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return date >= cutoff;
}

export interface EnrollmentStat {
  courseId: string;
  title: string;
  students: number;
}

export interface PlatformAnalytics extends AnalyticsOverview {
  enrollmentByCourse: EnrollmentStat[];
  totalModules: number;
  totalSlides: number;
  totalNotes: number;
  suspendedStudents: number;
}

export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  const users = listUsers();
  const students = users.filter((user) => user.role === "student");
  const programs = getPrograms();

  let totalVideos = 0;
  let totalSlides = 0;
  let totalNotes = 0;
  let totalModules = 0;

  for (const program of programs) {
    totalModules += program.modules.length;
    for (const mod of program.modules) {
      totalVideos += mod.videos.filter((video) => video.status === "published").length;
      totalSlides += mod.ppts.length;
      totalNotes += mod.notes.length;
    }
  }

  const enrollmentByCourse: EnrollmentStat[] = DEMO_COURSES.map((course) => ({
    courseId: course.id,
    title: course.title,
    students: students.filter((student) => student.course_ids.includes(course.id)).length,
  }));

  const [privateStorage, legacyStorage] = await Promise.all([
    directorySize(PRIVATE_UPLOADS),
    directorySize(LEGACY_PUBLIC_UPLOADS),
  ]);

  const activeStudents = students.filter(
    (student) =>
      student.status === "active" &&
      (isWithinDays(student.last_login, 30) || student.course_ids.length > 0)
  ).length;

  const todayLogins = users.filter((user) => isToday(user.last_login)).length;
  const totalWatchSeconds = getTotalWatchTimeSeconds();
  const avgWatchTime =
    students.length > 0
      ? Math.round(totalWatchSeconds / students.length / 60)
      : 0;

  return {
    totalStudents: students.length,
    activeStudents,
    suspendedStudents: students.filter((student) => student.status === "suspended").length,
    totalCourses: programs.length,
    totalVideos,
    totalSlides,
    totalNotes,
    totalModules,
    totalDownloads: totalSlides + totalNotes,
    storageUsed: privateStorage + legacyStorage,
    revenue: 0,
    todayLogins,
    avgWatchTime,
    completionRate: getPlatformCompletionRate(),
    enrollmentByCourse,
  };
}
