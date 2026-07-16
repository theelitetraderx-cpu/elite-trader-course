import { getPrograms, getProgramByCourseId } from "@/lib/data/course-content-store";
import { getUserCourseIds } from "@/lib/data/user-store";
import { DEMO_COURSES } from "@/lib/data/demo-data";
import type { Course, Note, PPTFile, Video } from "@/types";
import type { CourseProgram } from "@/lib/data/course-hierarchy";

export function getEnrolledPrograms(userId: string): CourseProgram[] {
  const courseIds = getUserCourseIds(userId);
  return getPrograms().filter((p) => courseIds.includes(p.id));
}

function programStats(program: CourseProgram) {
  const module_count = program.modules.length;
  const video_count = program.modules.reduce((n, m) => n + m.videos.length, 0);
  const duration_minutes = program.modules.reduce(
    (n, m) => n + m.videos.reduce((s, v) => s + Math.ceil(v.duration_seconds / 60), 0),
    0
  );
  return { module_count, lesson_count: video_count, duration_minutes };
}

export function getEnrichedCourses(userId: string): Course[] {
  const courseIds = getUserCourseIds(userId);
  return DEMO_COURSES.filter((c) => courseIds.includes(c.id)).map((course) => {
    const program = getProgramByCourseId(course.id);
    if (!program) return course;
    const stats = programStats(program);
    return {
      ...course,
      module_count: stats.module_count,
      lesson_count: stats.lesson_count,
      duration_minutes: stats.duration_minutes,
    };
  });
}

export function getUserNotesFromStore(userId: string): Note[] {
  const notes: Note[] = [];
  for (const program of getEnrolledPrograms(userId)) {
    for (const mod of program.modules) {
      for (const note of mod.notes) {
        notes.push({
          id: note.id,
          title: note.title,
          content: note.content || undefined,
          file_url: note.file_url,
          course_id: program.id,
          lesson_id: mod.id,
          is_downloadable: note.is_downloadable,
          created_at: note.created_at,
        });
      }
    }
  }
  return notes;
}

export function getUserPPTsFromStore(userId: string): PPTFile[] {
  const ppts: PPTFile[] = [];
  for (const program of getEnrolledPrograms(userId)) {
    for (const mod of program.modules) {
      for (const ppt of mod.ppts) {
        ppts.push({
          id: ppt.id,
          title: ppt.title,
          file_url: ppt.file_url,
          course_id: program.id,
          lesson_id: mod.id,
          is_downloadable: ppt.is_downloadable,
          created_at: ppt.created_at,
        });
      }
    }
  }
  return ppts;
}

export function getUserVideosFromStore(userId: string): Video[] {
  const videos: Video[] = [];
  for (const program of getEnrolledPrograms(userId)) {
    for (const mod of program.modules) {
      for (const video of mod.videos) {
        if (video.status !== "published") continue;
        videos.push({
          id: video.id,
          title: video.title,
          description: video.description,
          type: video.type,
          url: video.url,
          duration_seconds: video.duration_seconds,
          course_id: program.id,
          module_id: mod.id,
          status: video.status,
          created_at: video.created_at,
        });
      }
    }
  }
  return videos;
}

export function countUserMaterials(userId: string) {
  return {
    notes: getUserNotesFromStore(userId).length,
    ppts: getUserPPTsFromStore(userId).length,
    videos: getUserVideosFromStore(userId).length,
  };
}
