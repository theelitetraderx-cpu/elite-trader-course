import type { SessionUser } from "@/types";
import { createSupabaseAdmin } from "./client";
import { isSupabaseDataEnabled } from "./app-data";
import {
  getStoredUserById,
  getStoredUserByLogin,
  recordUserLogin,
  verifyStoredPassword,
} from "@/lib/data/user-store";

function toSessionUser(user: {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: SessionUser["role"];
  avatar_url?: string | null;
}): SessionUser {
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    avatar_url: user.avatar_url ?? undefined,
  };
}

async function findSupabaseUserByLogin(identifier: string) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return null;

  const normalized = identifier.trim().toLowerCase();
  if (!normalized) return null;

  const select =
    "id, username, password_hash, full_name, email, role, status, avatar_url";

  const { data: byUsername } = await supabase
    .from("users")
    .select(select)
    .ilike("username", normalized)
    .maybeSingle();

  if (byUsername) return byUsername;

  const { data: byEmail } = await supabase
    .from("users")
    .select(select)
    .ilike("email", normalized)
    .maybeSingle();

  return byEmail ?? null;
}

async function authenticateFromSupabase(
  identifier: string,
  password: string
): Promise<SessionUser | null> {
  const supabase = createSupabaseAdmin();
  if (!supabase) return null;

  const user = await findSupabaseUserByLogin(identifier);
  if (!user) return null;
  if (user.status !== "active") return null;

  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  await supabase
    .from("users")
    .update({ last_login: new Date().toISOString() })
    .eq("id", user.id);

  return toSessionUser(user);
}

function authenticateFromStore(
  identifier: string,
  password: string
): SessionUser | null {
  const demoUser = getStoredUserByLogin(identifier);
  if (!demoUser) return null;
  if (demoUser.status !== "active") return null;
  if (!verifyStoredPassword(demoUser, password)) return null;

  recordUserLogin(demoUser.id);

  return toSessionUser(demoUser);
}

export async function authenticateUser(
  identifier: string,
  password: string
): Promise<SessionUser | null> {
  const trimmedIdentifier = identifier.trim();
  const trimmedPassword = password;
  if (!trimmedIdentifier || !trimmedPassword) return null;

  if (isSupabaseDataEnabled()) {
    const supabaseUser = await authenticateFromSupabase(
      trimmedIdentifier,
      trimmedPassword
    );
    if (supabaseUser) return supabaseUser;
  }

  return authenticateFromStore(trimmedIdentifier, trimmedPassword);
}

export async function getUserById(id: string): Promise<SessionUser | null> {
  if (isSupabaseDataEnabled()) {
    const supabase = createSupabaseAdmin();
    if (supabase) {
      const { data: user } = await supabase
        .from("users")
        .select("id, username, full_name, email, role, avatar_url, status")
        .eq("id", id)
        .single();

      if (user && user.status === "active") {
        return toSessionUser(user);
      }
    }
  }

  const demoUser = getStoredUserById(id);
  if (!demoUser || demoUser.status !== "active") return null;

  return toSessionUser(demoUser);
}
