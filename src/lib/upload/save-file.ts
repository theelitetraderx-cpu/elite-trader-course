import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { UploadCategory } from "./config";
import { buildContentApiUrl, getPrivateUploadDir } from "./storage-path";

function sanitizeFilename(name: string): string {
  const base = path.basename(name);
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function saveUploadFile(
  file: File,
  category: UploadCategory
): Promise<{ url: string; fileName: string; size: number }> {
  const uploadsDir = getPrivateUploadDir(category);
  await mkdir(uploadsDir, { recursive: true });

  const safeName = sanitizeFilename(file.name);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const diskPath = path.join(uploadsDir, uniqueName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buffer);

  return {
    url: buildContentApiUrl(category, uniqueName),
    fileName: safeName,
    size: file.size,
  };
}
