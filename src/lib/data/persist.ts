import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

/** On Vercel the app FS is read-only; /tmp is writable (ephemeral per instance). */
export const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "elite-trader-data")
  : path.join(process.cwd(), "storage", "data");

function filePath(filename: string) {
  return path.join(DATA_DIR, filename);
}

export function readJsonFile<T>(filename: string): T | null {
  const target = filePath(filename);
  if (!existsSync(target)) return null;
  try {
    return JSON.parse(readFileSync(target, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function writeJsonFile<T>(filename: string, data: T): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(filePath(filename), JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    // Never crash auth/API on serverless read-only failures — memory store still works
    console.warn(`[persist] skipped write for ${filename}:`, err);
  }
}
