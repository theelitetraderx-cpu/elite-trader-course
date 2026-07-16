/** Normalize username for storage and lookup — always lowercase, trimmed */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}
