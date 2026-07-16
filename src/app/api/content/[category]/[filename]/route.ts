import { access, readFile, stat } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canAccessUpload } from "@/lib/upload/content-access";
import type { UploadCategory } from "@/lib/upload/config";
import { parseContentApiPath, resolveUploadFileLocations } from "@/lib/upload/storage-path";
import { downloadFromSupabaseStorage } from "@/lib/upload/supabase-storage";
import { ensureAppDataLoaded } from "@/lib/data/ensure-data-loaded";

const MIME_BY_EXT: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
  ".md": "text/markdown",
};

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function getMimeType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

type RouteContext = { params: Promise<{ category: string; filename: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureAppDataLoaded();

  const { category, filename } = await context.params;
  const parsed = parseContentApiPath(category, filename);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  const uploadCategory = parsed.category as UploadCategory;
  const locations = resolveUploadFileLocations(uploadCategory, parsed.fileName);
  if (!locations) {
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
  }

  if (!canAccessUpload(session, uploadCategory, locations.safeName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 1) Local /tmp disk
  let filePath = locations.privatePath;
  if (await fileExists(filePath)) {
    const [buffer, fileStat] = await Promise.all([readFile(filePath), stat(filePath)]);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": getMimeType(locations.safeName),
        "Content-Length": String(fileStat.size),
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
      },
    });
  }

  if (await fileExists(locations.legacyPath)) {
    filePath = locations.legacyPath;
    const [buffer, fileStat] = await Promise.all([readFile(filePath), stat(filePath)]);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": getMimeType(locations.safeName),
        "Content-Length": String(fileStat.size),
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
      },
    });
  }

  // 2) Supabase Storage (live site)
  const remote = await downloadFromSupabaseStorage(uploadCategory, locations.safeName);
  if (remote) {
    return new NextResponse(new Uint8Array(remote.buffer), {
      status: 200,
      headers: {
        "Content-Type": remote.contentType || getMimeType(locations.safeName),
        "Content-Length": String(remote.buffer.length),
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
      },
    });
  }

  return NextResponse.json({ error: "File not found" }, { status: 404 });
}

export const runtime = "nodejs";
export const maxDuration = 60;
