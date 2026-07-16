import { readJsonFile, writeJsonFile } from "@/lib/data/persist";
import type { Notification, NotificationType } from "@/types";
import { listUsers } from "@/lib/data/user-store";

const NOTIFICATIONS_FILE = "notifications.json";

declare global {
  // eslint-disable-next-line no-var
  var __eliteNotificationStore: Notification[] | undefined;
}

function loadStore(): Notification[] {
  return readJsonFile<Notification[]>(NOTIFICATIONS_FILE) ?? [];
}

function getStore(): Notification[] {
  if (!global.__eliteNotificationStore) {
    global.__eliteNotificationStore = loadStore();
  }
  return global.__eliteNotificationStore;
}

function saveStore() {
  writeJsonFile(NOTIFICATIONS_FILE, getStore());
}

export function uid(prefix = "notif") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function ensureNotificationsLoaded(): Promise<void> {
  if (!global.__eliteNotificationStore) {
    global.__eliteNotificationStore = loadStore();
  }
}

export function listNotificationsForUser(userId: string): Notification[] {
  return getStore()
    .filter((n) => n.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function createNotification(input: {
  user_id: string;
  title: string;
  message: string;
  type?: NotificationType;
  reference_id?: string;
}): Notification {
  const notification: Notification = {
    id: uid(),
    user_id: input.user_id,
    title: input.title,
    message: input.message,
    type: input.type ?? "general",
    reference_id: input.reference_id,
    read: false,
    created_at: new Date().toISOString(),
  };

  getStore().unshift(notification);
  saveStore();
  return notification;
}

export function broadcastToStudents(input: {
  title: string;
  message: string;
  type?: NotificationType;
  reference_id?: string;
}): Notification[] {
  const students = listUsers().filter(
    (user) => user.role === "student" && user.status === "active"
  );

  return students.map((student) =>
    createNotification({
      user_id: student.id,
      title: input.title,
      message: input.message,
      type: input.type,
      reference_id: input.reference_id,
    })
  );
}

export function markNotificationRead(userId: string, notificationId: string): boolean {
  const notification = getStore().find(
    (n) => n.id === notificationId && n.user_id === userId
  );
  if (!notification) return false;
  notification.read = true;
  saveStore();
  return true;
}

export function markAllNotificationsRead(userId: string): number {
  let count = 0;
  for (const notification of getStore()) {
    if (notification.user_id === userId && !notification.read) {
      notification.read = true;
      count += 1;
    }
  }
  if (count > 0) saveStore();
  return count;
}
