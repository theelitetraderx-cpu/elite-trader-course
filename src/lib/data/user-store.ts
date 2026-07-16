import bcrypt from "bcryptjs";
import type { User, UserRole, UserStatus, StaffPermissions } from "@/types";
import { defaultPermissionsForRole } from "@/lib/admin/permissions";
import { readJsonFile, writeJsonFile } from "@/lib/data/persist";
import { normalizeUsername } from "@/lib/normalize-username";
import {
  fetchAllCourseAccess,
  fetchCourseIdsForUser,
  setCourseIdsForUser,
} from "@/lib/supabase/app-data";

const USERS_FILE = "users.json";

export interface StoredUser extends User {
  password_hash: string;
  course_ids: string[];
}

export interface AdminUserView extends User {
  course_ids: string[];
}

const PROTECTED_ADMIN_ID = "admin-001";

type SeedUser = Omit<StoredUser, "password_hash" | "created_at" | "updated_at"> & {
  password: string;
  created_at?: string;
  updated_at?: string;
};

const SEED_USERS: SeedUser[] = [
  {
    id: "admin-001",
    username: "admin",
    // Prefer Vercel/local env; fallback keeps production login working without setup
    password: process.env.ADMIN_SEED_PASSWORD || "Haree@200716",
    full_name: "Elite Admin",
    email: process.env.ADMIN_SEED_EMAIL || "theelitetraderx@gmail.com",
    role: "super_admin",
    status: "active",
    course_ids: [],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    last_login: "2026-07-04T09:00:00Z",
  },
  {
    id: "student-001",
    username: "student",
    password: "student123",
    full_name: "John Trader",
    email: "student@elitetrader.in",
    phone: "+91 98765 43210",
    role: "student",
    status: "active",
    course_ids: [],
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    last_login: "2026-07-03T08:00:00Z",
  },
  {
    id: "student-002",
    username: "sarah_w",
    password: "sarah123",
    full_name: "Sarah Williams",
    email: "sarah@example.com",
    phone: "+1 555-010-2200",
    role: "student",
    status: "active",
    course_ids: [],
    expiry_date: "2027-06-01",
    created_at: "2025-08-15T00:00:00Z",
    updated_at: "2026-02-28T00:00:00Z",
    last_login: "2026-07-02T14:30:00Z",
  },
];

declare global {
  // eslint-disable-next-line no-var
  var __eliteUserStore: StoredUser[] | undefined;
  // eslint-disable-next-line no-var
  var __eliteUserCourseAccess: Map<string, string[]> | undefined;
  // eslint-disable-next-line no-var
  var __eliteUserAccessLoaded: boolean | undefined;
}

function buildInitialStore(): StoredUser[] {
  const now = new Date().toISOString();
  return SEED_USERS.map((seed) => ({
    id: seed.id,
    username: seed.username,
    full_name: seed.full_name,
    email: seed.email,
    phone: seed.phone,
    role: seed.role,
    status: seed.status,
    avatar_url: seed.avatar_url,
    expiry_date: seed.expiry_date,
    created_at: seed.created_at ?? now,
    updated_at: seed.updated_at ?? now,
    last_login: seed.last_login,
    password_hash: bcrypt.hashSync(seed.password, 12),
    course_ids: [...seed.course_ids],
  }));
}

function persistStore(store: StoredUser[]) {
  writeJsonFile(USERS_FILE, store);
}

function loadStore(): StoredUser[] {
  const saved = readJsonFile<StoredUser[]>(USERS_FILE);
  if (saved?.length) {
    const primary = saved.find((u) => u.id === PROTECTED_ADMIN_ID);
    if (primary) {
      let changed = false;
      if (primary.role === "admin") {
        primary.role = "super_admin";
        changed = true;
      }

      const seedAdmin = SEED_USERS.find((u) => u.id === PROTECTED_ADMIN_ID);
      if (seedAdmin) {
        const stillOnLegacyPassword = bcrypt.compareSync(
          "admin123",
          primary.password_hash
        );
        const stillOnLegacyEmail = primary.email === "admin@elitetrader.com";

        if (stillOnLegacyPassword || stillOnLegacyEmail) {
          primary.email = seedAdmin.email;
          primary.password_hash = bcrypt.hashSync(seedAdmin.password, 12);
          primary.updated_at = new Date().toISOString();
          changed = true;
        }
      }

      if (changed) writeJsonFile(USERS_FILE, saved);
    }
    return saved;
  }
  const initial = buildInitialStore();
  persistStore(initial);
  return initial;
}

function getStore(): StoredUser[] {
  if (!global.__eliteUserStore) {
    global.__eliteUserStore = loadStore();
  }
  return global.__eliteUserStore;
}

function saveStore() {
  persistStore(getStore());
}

export async function ensureUserCourseAccessLoaded(): Promise<void> {
  if (global.__eliteUserAccessLoaded) return;

  const fromSupabase = await fetchAllCourseAccess();
  if (fromSupabase.size > 0) {
    global.__eliteUserCourseAccess = fromSupabase;
    const store = getStore();
    for (const user of store) {
      const ids = fromSupabase.get(user.id);
      if (ids) user.course_ids = [...ids];
    }
    saveStore();
  } else {
    global.__eliteUserCourseAccess = new Map(
      getStore().map((user) => [user.id, [...user.course_ids]])
    );
  }

  global.__eliteUserAccessLoaded = true;
}

function syncCourseAccessCache(userId: string, courseIds: string[]) {
  if (!global.__eliteUserCourseAccess) {
    global.__eliteUserCourseAccess = new Map();
  }
  global.__eliteUserCourseAccess.set(userId, [...courseIds]);
  void setCourseIdsForUser(userId, courseIds);
}

export function uid(prefix = "user") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function toPublicUser(user: StoredUser): AdminUserView {
  const { password_hash: _, ...rest } = user;
  return { ...rest, course_ids: [...user.course_ids] };
}

export function listUsers(): AdminUserView[] {
  return getStore().map(toPublicUser);
}

export function getStoredUserById(id: string): StoredUser | null {
  return getStore().find((u) => u.id === id) ?? null;
}

export function getStoredUserByUsername(username: string): StoredUser | null {
  const normalized = normalizeUsername(username);
  return (
    getStore().find((u) => u.username.toLowerCase() === normalized) ?? null
  );
}

export function getStoredUserByEmail(email: string): StoredUser | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  return (
    getStore().find((u) => u.email.toLowerCase() === normalized) ?? null
  );
}

/** Look up by username first, then by email (for login). */
export function getStoredUserByLogin(identifier: string): StoredUser | null {
  return (
    getStoredUserByUsername(identifier) ?? getStoredUserByEmail(identifier)
  );
}

export function getUserCourseIds(userId: string): string[] {
  const cached = global.__eliteUserCourseAccess?.get(userId);
  if (cached) return [...cached];
  return getStoredUserById(userId)?.course_ids ?? [];
}

export async function getUserCourseIdsAsync(userId: string): Promise<string[]> {
  const fromSupabase = await fetchCourseIdsForUser(userId);
  if (fromSupabase) {
    syncCourseAccessCache(userId, fromSupabase);
    const user = getStoredUserById(userId);
    if (user) {
      user.course_ids = [...fromSupabase];
      saveStore();
    }
    return fromSupabase;
  }
  return getUserCourseIds(userId);
}

export interface CreateUserInput {
  username: string;
  password: string;
  full_name: string;
  email: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  expiry_date?: string;
  course_ids?: string[];
  staff_permissions?: StaffPermissions;
  managed_by?: string;
}

export interface CreateStaffInput extends CreateUserInput {
  role: "admin" | "moderator";
}

export function createStaffUser(input: CreateStaffInput): AdminUserView {
  const permissions =
    input.staff_permissions ?? defaultPermissionsForRole(input.role);
  return createUser({
    ...input,
    staff_permissions: permissions,
    managed_by: input.managed_by,
  });
}

export function updateStaffPermissions(
  id: string,
  permissions: StaffPermissions
): AdminUserView {
  const store = getStore();
  const user = store.find((u) => u.id === id);
  if (!user) throw new Error("User not found");
  if (user.role !== "admin" && user.role !== "moderator") {
    throw new Error("Permissions can only be set for admin or moderator accounts");
  }
  user.staff_permissions = { ...permissions };
  user.updated_at = new Date().toISOString();
  saveStore();
  return toPublicUser(user);
}

export function listStaffUsers(): AdminUserView[] {
  return listUsers().filter(
    (u) => u.role === "super_admin" || u.role === "admin" || u.role === "moderator"
  );
}

export function countStudentsCreatedBy(staffId: string): number {
  return getStore().filter(
    (u) => u.role === "student" && u.managed_by === staffId
  ).length;
}

export function createUser(input: CreateUserInput): AdminUserView {
  const store = getStore();
  const username = normalizeUsername(input.username);
  const email = input.email.trim().toLowerCase();

  if (store.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username already exists");
  }
  if (store.some((u) => u.email.toLowerCase() === email)) {
    throw new Error("Email already in use");
  }

  const now = new Date().toISOString();
  const user: StoredUser = {
    id: uid("user"),
    username,
    full_name: input.full_name.trim(),
    email,
    phone: input.phone?.trim() || undefined,
    role: input.role ?? "student",
    status: input.status ?? "active",
    expiry_date: input.expiry_date || undefined,
    staff_permissions: input.staff_permissions,
    managed_by: input.managed_by,
    course_ids: input.course_ids ?? [],
    created_at: now,
    updated_at: now,
    password_hash: bcrypt.hashSync(input.password, 12),
  };

  store.push(user);
  syncCourseAccessCache(user.id, user.course_ids);
  saveStore();
  return toPublicUser(user);
}

export interface UpdateUserInput {
  username?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  expiry_date?: string | null;
  course_ids?: string[];
  staff_permissions?: StaffPermissions;
  managed_by?: string | null;
}

export function updateUser(id: string, input: UpdateUserInput): AdminUserView {
  const store = getStore();
  const index = store.findIndex((u) => u.id === id);
  if (index === -1) throw new Error("User not found");

  const current = store[index];

  if (input.username !== undefined) {
    const username = normalizeUsername(input.username);
    if (
      store.some(
        (u) => u.id !== id && u.username.toLowerCase() === username.toLowerCase()
      )
    ) {
      throw new Error("Username already exists");
    }
    current.username = username;
  }

  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    if (store.some((u) => u.id !== id && u.email.toLowerCase() === email)) {
      throw new Error("Email already in use");
    }
    current.email = email;
  }

  if (input.full_name !== undefined) current.full_name = input.full_name.trim();
  if (input.phone !== undefined) {
    current.phone = input.phone.trim() || undefined;
  }
  if (input.role !== undefined) current.role = input.role;
  if (input.status !== undefined) current.status = input.status;
  if (input.expiry_date !== undefined) {
    current.expiry_date = input.expiry_date || undefined;
  }
  if (input.course_ids !== undefined) {
    current.course_ids = [...input.course_ids];
    syncCourseAccessCache(id, current.course_ids);
  }
  if (input.staff_permissions !== undefined) {
    current.staff_permissions = { ...input.staff_permissions };
  }
  if (input.managed_by !== undefined) {
    current.managed_by = input.managed_by || undefined;
  }

  current.updated_at = new Date().toISOString();
  store[index] = current;
  saveStore();
  return toPublicUser(current);
}

export function updateUserPassword(id: string, password: string): void {
  const user = getStoredUserById(id);
  if (!user) throw new Error("User not found");
  user.password_hash = bcrypt.hashSync(password, 12);
  user.updated_at = new Date().toISOString();
  saveStore();
}

export function deleteUser(id: string): void {
  if (id === PROTECTED_ADMIN_ID) {
    throw new Error("The primary admin account cannot be deleted");
  }
  const store = getStore();
  const index = store.findIndex((u) => u.id === id);
  if (index === -1) throw new Error("User not found");
  store.splice(index, 1);
  saveStore();
}

export function recordUserLogin(id: string): void {
  const user = getStoredUserById(id);
  if (!user) return;
  user.last_login = new Date().toISOString();
  saveStore();
}

export function verifyStoredPassword(
  user: StoredUser,
  password: string
): boolean {
  return bcrypt.compareSync(password, user.password_hash);
}

export function isProtectedAdmin(id: string): boolean {
  return id === PROTECTED_ADMIN_ID;
}

export function isProtectedSuperAdmin(id: string): boolean {
  return id === PROTECTED_ADMIN_ID;
}
