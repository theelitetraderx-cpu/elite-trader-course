import { jwtVerify } from "jose";
import type { SessionUser, UserRole } from "@/types";

/** Shared session cookie name — safe for Edge middleware */
export const SESSION_COOKIE = "elite_trader_session";
export const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
  const secret =
    process.env.JWT_SECRET || "elite-trader-dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

/** JWT verify only — no Node APIs (safe for middleware / Edge) */
export async function verifySession(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      id: payload.id as string,
      username: payload.username as string,
      full_name: payload.full_name as string,
      email: payload.email as string,
      role: payload.role as UserRole,
      avatar_url: payload.avatar_url as string | undefined,
    };
  } catch {
    return null;
  }
}

export function getJwtSecretKey() {
  return getSecretKey();
}
