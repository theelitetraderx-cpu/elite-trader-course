import { readJsonFile, writeJsonFile } from "@/lib/data/persist";
import { fetchJsonDocument, saveJsonDocument } from "@/lib/data/json-document-store";
import type { LiveMeeting, MeetingAudience, MeetingStatus } from "@/types";
import { broadcastToStudents } from "@/lib/data/notification-store";

const MEETINGS_FILE = "meetings.json";
const REMOTE_DOC_ID = "meetings";

declare global {
  // eslint-disable-next-line no-var
  var __eliteMeetingStore: LiveMeeting[] | undefined;
  // eslint-disable-next-line no-var
  var __eliteMeetingsHydrated: boolean | undefined;
}

function loadStore(): LiveMeeting[] {
  return readJsonFile<LiveMeeting[]>(MEETINGS_FILE) ?? [];
}

function getStore(): LiveMeeting[] {
  if (!global.__eliteMeetingStore) {
    global.__eliteMeetingStore = loadStore();
  }
  return global.__eliteMeetingStore;
}

function saveStore() {
  const data = getStore();
  writeJsonFile(MEETINGS_FILE, data);
  void saveJsonDocument(REMOTE_DOC_ID, data);
}

export function uid(prefix = "meeting") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function ensureMeetingsLoaded(): Promise<void> {
  if (global.__eliteMeetingsHydrated && global.__eliteMeetingStore) return;

  const local = loadStore();
  const remote = await fetchJsonDocument<LiveMeeting[]>(REMOTE_DOC_ID);

  if (remote && remote.length >= local.length) {
    global.__eliteMeetingStore = remote;
    writeJsonFile(MEETINGS_FILE, remote);
  } else {
    global.__eliteMeetingStore = local;
    if (local.length) void saveJsonDocument(REMOTE_DOC_ID, local);
  }

  global.__eliteMeetingsHydrated = true;
}

export function listMeetings(): LiveMeeting[] {
  return [...getStore()].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
}

export function listUpcomingMeetings(): LiveMeeting[] {
  const now = new Date().toISOString();
  return listMeetings().filter(
    (meeting) =>
      (meeting.status === "scheduled" || meeting.status === "live") &&
      meeting.scheduled_at >= now.slice(0, 10)
  );
}

export function getMeetingById(id: string): LiveMeeting | null {
  return getStore().find((meeting) => meeting.id === id) ?? null;
}

export interface CreateMeetingInput {
  title: string;
  description?: string;
  meeting_url: string;
  scheduled_at: string;
  duration_minutes?: number;
  audience?: MeetingAudience;
  created_by: string;
  created_by_name: string;
  notify_students?: boolean;
}

function formatMeetingWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function createMeeting(input: CreateMeetingInput): {
  meeting: LiveMeeting;
  notifiedCount: number;
} {
  const meeting: LiveMeeting = {
    id: uid(),
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    meeting_url: input.meeting_url.trim(),
    scheduled_at: input.scheduled_at,
    duration_minutes: input.duration_minutes ?? 60,
    status: "scheduled",
    audience: input.audience ?? "all",
    created_by: input.created_by,
    created_by_name: input.created_by_name,
    created_at: new Date().toISOString(),
  };

  getStore().push(meeting);
  saveStore();

  let notifiedCount = 0;
  if (input.notify_students !== false) {
    try {
      const when = formatMeetingWhen(meeting.scheduled_at);
      const notifications = broadcastToStudents({
        title: `Live Meeting: ${meeting.title}`,
        message: `Scheduled for ${when}. Join link is available in your portal.`,
        type: "meeting",
        reference_id: meeting.id,
      });
      notifiedCount = notifications.length;
    } catch (err) {
      console.warn("[meetings] notify failed:", err);
    }
  }

  return { meeting, notifiedCount };
}

export function updateMeeting(
  id: string,
  input: Partial<
    Pick<
      LiveMeeting,
      | "title"
      | "description"
      | "meeting_url"
      | "scheduled_at"
      | "duration_minutes"
      | "status"
      | "audience"
    >
  >
): LiveMeeting {
  const meeting = getStore().find((item) => item.id === id);
  if (!meeting) throw new Error("Meeting not found");

  if (input.title !== undefined) meeting.title = input.title.trim();
  if (input.description !== undefined) {
    meeting.description = input.description.trim() || undefined;
  }
  if (input.meeting_url !== undefined) meeting.meeting_url = input.meeting_url.trim();
  if (input.scheduled_at !== undefined) meeting.scheduled_at = input.scheduled_at;
  if (input.duration_minutes !== undefined) {
    meeting.duration_minutes = input.duration_minutes;
  }
  if (input.status !== undefined) meeting.status = input.status;
  if (input.audience !== undefined) meeting.audience = input.audience;

  saveStore();
  return meeting;
}

export function deleteMeeting(id: string): void {
  const store = getStore();
  const index = store.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Meeting not found");
  store.splice(index, 1);
  saveStore();
}

export function setMeetingStatus(id: string, status: MeetingStatus): LiveMeeting {
  return updateMeeting(id, { status });
}
