import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { UploadCategory } from "./config";
import { buildContentApiUrl, getPrivateUploadDir } from "./storage-path";
import {
  isSupabaseStorageEnabled,
  uploadToSupabaseStorage,
} from "./supabase-storage";

function sanitizeFilename(name: string): string {
  const base = path.basename(name);
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export function makeUniqueUploadName(originalName: string): string {
  const safeName = sanitizeFilename(originalName);
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
}

export async function saveUploadFile(
  file: File,
  category: UploadCategory
): Promise<{ url: string; fileName: string; size: number }> {
  const uniqueName = makeUniqueUploadName(file.name);
  const safeName = sanitizeFilename(file.name);

  // Prefer Supabase Storage on live / when configured (persistent)
  if (isSupabaseStorageEnabled()) {
    const saved = await uploadToSupabaseStorage(file, category, uniqueName, file.type);
    return {
      url: saved.url,
      fileName: safeName,
      size: file.size,
    };
  }

  const uploadsDir = getPrivateUploadDir(category);

  try {
    await mkdir(uploadsDir, { recursive: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cannot create upload folder";
    throw new Error(`Upload storage unavailable: ${message}`);
  }

  const diskPath = path.join(uploadsDir, uniqueName);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(diskPath, buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Write failed";
    throw new Error(`Failed to save file: ${message}`);
  }

  return {
    url: buildContentApiUrl(category, uniqueName),
    fileName: safeName,
    size: file.size,
  };
}
