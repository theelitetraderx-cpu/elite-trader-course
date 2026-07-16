import { getPrograms } from "@/lib/data/course-content-store";
import { getUserCourseIds } from "@/lib/data/user-store";
import type { SessionUser } from "@/types";
import type { UploadCategory } from "@/lib/upload/config";
import { extractUploadReference } from "@/lib/upload/storage-path";

function urlMatchesReference(storedUrl: string, category: UploadCategory, fileName: string) {
  const ref = extractUploadReference(storedUrl);
  if (ref) {
    return ref.category === category && ref.fileName === fileName;
  }
  return storedUrl.includes(fileName);
}

function isFileInPrograms(
  category: UploadCategory,
  fileName: string,
  programIds?: string[]
) {
  const programs = getPrograms().filter((program) =>
    programIds ? programIds.includes(program.id) : true
  );

  for (const program of programs) {
    for (const mod of program.modules) {
      if (category === "videos") {
        if (mod.videos.some((item) => urlMatchesReference(item.url, category, fileName))) {
          return true;
        }
      }
      if (category === "ppt") {
        if (mod.ppts.some((item) => urlMatchesReference(item.file_url, category, fileName))) {
          return true;
        }
      }
      if (category === "notes") {
        if (
          mod.notes.some(
            (item) =>
              (item.file_url && urlMatchesReference(item.file_url, category, fileName)) ||
              false
          )
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

export function canAccessUpload(
  session: SessionUser,
  category: UploadCategory,
  fileName: string
): boolean {
  if (session.role === "admin") return true;

  const enrolledIds = getUserCourseIds(session.id);
  if (!enrolledIds.length) return false;

  return isFileInPrograms(category, fileName, enrolledIds);
}

export function isUploadReferenced(category: UploadCategory, fileName: string): boolean {
  return isFileInPrograms(category, fileName);
}
