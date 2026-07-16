import { readJsonFile, writeJsonFile } from "@/lib/data/persist";

const QUERIES_FILE = "support-queries.json";

export type SupportQueryCategory =
  | "general"
  | "billing"
  | "technical"
  | "course"
  | "account";

export type SupportQueryStatus = "open" | "in_progress" | "resolved";

export interface SupportQuery {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  category: SupportQueryCategory;
  status: SupportQueryStatus;
  created_at: string;
  updated_at: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __eliteSupportQueryStore: SupportQuery[] | undefined;
}

function loadStore(): SupportQuery[] {
  return readJsonFile<SupportQuery[]>(QUERIES_FILE) ?? [];
}

function getStore(): SupportQuery[] {
  if (!global.__eliteSupportQueryStore) {
    global.__eliteSupportQueryStore = loadStore();
  }
  return global.__eliteSupportQueryStore;
}

function saveStore() {
  writeJsonFile(QUERIES_FILE, getStore());
}

export function uid(prefix = "query") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function ensureSupportQueriesLoaded(): Promise<void> {
  if (!global.__eliteSupportQueryStore) {
    global.__eliteSupportQueryStore = loadStore();
  }
}

export function listQueriesForUser(userId: string): SupportQuery[] {
  return getStore()
    .filter((q) => q.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function createSupportQuery(input: {
  user_id: string;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  category: SupportQueryCategory;
}): SupportQuery {
  const now = new Date().toISOString();
  const query: SupportQuery = {
    id: uid(),
    user_id: input.user_id,
    user_name: input.user_name,
    user_email: input.user_email,
    subject: input.subject.trim(),
    message: input.message.trim(),
    category: input.category,
    status: "open",
    created_at: now,
    updated_at: now,
  };

  getStore().unshift(query);
  saveStore();
  return query;
}
