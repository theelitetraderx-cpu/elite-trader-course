import { readJsonFile, writeJsonFile } from "@/lib/data/persist";
import type { Announcement, AnnouncementPriority } from "@/types";
import { broadcastToStudents } from "@/lib/data/notification-store";

const ANNOUNCEMENTS_FILE = "announcements.json";

declare global {
  // eslint-disable-next-line no-var
  var __eliteAnnouncementStore: Announcement[] | undefined;
}

function loadStore(): Announcement[] {
  return readJsonFile<Announcement[]>(ANNOUNCEMENTS_FILE) ?? [];
}

function getStore(): Announcement[] {
  if (!global.__eliteAnnouncementStore) {
    global.__eliteAnnouncementStore = loadStore();
  }
  return global.__eliteAnnouncementStore;
}

function saveStore() {
  writeJsonFile(ANNOUNCEMENTS_FILE, getStore());
}

export function uid(prefix = "announce") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function ensureAnnouncementsLoaded(): Promise<void> {
  if (!global.__eliteAnnouncementStore) {
    global.__eliteAnnouncementStore = loadStore();
  }
}

export function listAnnouncements(): Announcement[] {
  return [...getStore()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getAnnouncementById(id: string): Announcement | null {
  return getStore().find((item) => item.id === id) ?? null;
}

export interface CreateAnnouncementInput {
  title: string;
  message: string;
  priority?: AnnouncementPriority;
  created_by: string;
  created_by_name: string;
  notify_students?: boolean;
}

export function createAnnouncement(input: CreateAnnouncementInput): {
  announcement: Announcement;
  notifiedCount: number;
} {
  const announcement: Announcement = {
    id: uid(),
    title: input.title.trim(),
    message: input.message.trim(),
    priority: input.priority ?? "normal",
    created_by: input.created_by,
    created_by_name: input.created_by_name,
    notified_count: 0,
    created_at: new Date().toISOString(),
  };

  getStore().unshift(announcement);
  saveStore();

  let notifiedCount = 0;
  if (input.notify_students !== false) {
    const notifications = broadcastToStudents({
      title: announcement.title,
      message: announcement.message,
      type: "announcement",
      reference_id: announcement.id,
    });
    notifiedCount = notifications.length;
    announcement.notified_count = notifiedCount;
    saveStore();
  }

  return { announcement, notifiedCount };
}

export function deleteAnnouncement(id: string): boolean {
  const index = getStore().findIndex((item) => item.id === id);
  if (index === -1) return false;
  getStore().splice(index, 1);
  saveStore();
  return true;
}
