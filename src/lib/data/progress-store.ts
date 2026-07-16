import { readJsonFile, writeJsonFile } from "@/lib/data/persist";
import { getEnrolledPrograms } from "@/lib/course-content";
import { listUsers } from "@/lib/data/user-store";
import {
  fetchProgressFromSupabase,
  upsertProgressToSupabase,
} from "@/lib/supabase/progress-data";

const PROGRESS_FILE = "progress.json";

export interface ModuleProgressRecord {
  user_id: string;
  course_id: string;
  module_id: string;
  completed: boolean;
  watch_time_seconds: number;
  completed_at?: string;
  updated_at: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __eliteProgressStore: ModuleProgressRecord[] | undefined;
  // eslint-disable-next-line no-var
  var __eliteProgressLoaded: boolean | undefined;
}

function loadProgress(): ModuleProgressRecord[] {
  return readJsonFile<ModuleProgressRecord[]>(PROGRESS_FILE) ?? [];
}

function getStore(): ModuleProgressRecord[] {
  if (!global.__eliteProgressStore) {
    global.__eliteProgressStore = loadProgress();
  }
  return global.__eliteProgressStore;
}

function saveStore() {
  writeJsonFile(PROGRESS_FILE, getStore());
}

function persistRecord(record: ModuleProgressRecord) {
  saveStore();
  void upsertProgressToSupabase(record);
}

export async function ensureProgressLoaded(): Promise<void> {
  if (global.__eliteProgressLoaded && global.__eliteProgressStore) return;

  const fromSupabase = await fetchProgressFromSupabase();
  if (fromSupabase?.length) {
    global.__eliteProgressStore = fromSupabase;
    writeJsonFile(PROGRESS_FILE, fromSupabase);
  } else if (!global.__eliteProgressStore) {
    global.__eliteProgressStore = loadProgress();
  }

  global.__eliteProgressLoaded = true;
}

function findRecord(userId: string, moduleId: string) {
  return getStore().find(
    (record) => record.user_id === userId && record.module_id === moduleId
  );
}

export function getUserProgress(userId: string): ModuleProgressRecord[] {
  return getStore().filter((record) => record.user_id === userId);
}

export function getModuleProgress(userId: string, moduleId: string) {
  return findRecord(userId, moduleId) ?? null;
}

export function markModuleComplete(
  userId: string,
  courseId: string,
  moduleId: string
): ModuleProgressRecord {
  const store = getStore();
  const now = new Date().toISOString();
  const existing = findRecord(userId, moduleId);

  if (existing) {
    existing.completed = true;
    existing.completed_at = existing.completed_at ?? now;
    existing.updated_at = now;
    persistRecord(existing);
    return existing;
  }

  const record: ModuleProgressRecord = {
    user_id: userId,
    course_id: courseId,
    module_id: moduleId,
    completed: true,
    watch_time_seconds: 0,
    completed_at: now,
    updated_at: now,
  };
  store.push(record);
  persistRecord(record);
  return record;
}

export function addWatchTime(
  userId: string,
  courseId: string,
  moduleId: string,
  seconds: number
): ModuleProgressRecord {
  const store = getStore();
  const now = new Date().toISOString();
  const existing = findRecord(userId, moduleId);

  if (existing) {
    existing.watch_time_seconds += Math.max(0, Math.round(seconds));
    existing.updated_at = now;
    persistRecord(existing);
    return existing;
  }

  const record: ModuleProgressRecord = {
    user_id: userId,
    course_id: courseId,
    module_id: moduleId,
    completed: false,
    watch_time_seconds: Math.max(0, Math.round(seconds)),
    updated_at: now,
  };
  store.push(record);
  persistRecord(record);
  return record;
}

function publishedModuleCount(userId: string) {
  let total = 0;
  for (const program of getEnrolledPrograms(userId)) {
    total += program.modules.filter(
      (mod) =>
        mod.videos.length > 0 || mod.ppts.length > 0 || mod.notes.length > 0
    ).length;
  }
  return total;
}

export function getUserProgressStats(userId: string) {
  const records = getUserProgress(userId);
  const completed = records.filter((record) => record.completed).length;
  const totalModules = publishedModuleCount(userId);
  const watchTimeSeconds = records.reduce(
    (sum, record) => sum + record.watch_time_seconds,
    0
  );

  return {
    completedModules: completed,
    totalModules,
    completionRate:
      totalModules > 0 ? Math.round((completed / totalModules) * 100) : 0,
    watchTimeSeconds,
    watchTimeHours: Math.floor(watchTimeSeconds / 3600),
    watchTimeMinutes: Math.floor((watchTimeSeconds % 3600) / 60),
  };
}

export function getCourseProgressPercent(userId: string, courseId: string) {
  const program = getEnrolledPrograms(userId).find((item) => item.id === courseId);
  if (!program) return 0;

  const published = program.modules.filter(
    (mod) =>
      mod.videos.length > 0 || mod.ppts.length > 0 || mod.notes.length > 0
  );
  if (!published.length) return 0;

  const completed = published.filter((mod) =>
    getModuleProgress(userId, mod.id)?.completed
  ).length;

  return Math.round((completed / published.length) * 100);
}

export function getPlatformCompletionRate() {
  const students = listUsers().filter((user) => user.role === "student");
  if (!students.length) return 0;

  const rates = students.map((student) => getUserProgressStats(student.id).completionRate);
  return Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length);
}

export function getTotalWatchTimeSeconds() {
  return getStore().reduce((sum, record) => sum + record.watch_time_seconds, 0);
}
