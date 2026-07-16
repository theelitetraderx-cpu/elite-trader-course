import {
  getEnrichedCourses,
  getUserNotesFromStore,
  getUserPPTsFromStore,
  getUserVideosFromStore,
  getEnrolledPrograms,
  countUserMaterials,
} from "@/lib/course-content";

export async function getUserPurchasedCourses(userId: string) {
  return getEnrichedCourses(userId);
}

export async function getUserNotes(userId: string) {
  return getUserNotesFromStore(userId);
}

export async function getUserPPTs(userId: string) {
  return getUserPPTsFromStore(userId);
}

export async function getUserVideos(userId: string) {
  return getUserVideosFromStore(userId);
}

export { getEnrolledPrograms, countUserMaterials };
