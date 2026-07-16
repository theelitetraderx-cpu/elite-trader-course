import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  validateUploadFile,
  type UploadCategory,
} from "@/lib/upload/config";
import { saveUploadFile } from "@/lib/upload/save-file";
import { isSupabaseStorageEnabled } from "@/lib/upload/supabase-storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const CATEGORIES = new Set<UploadCategory>(["videos", "ppt", "notes"]);

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const category = formData.get("category");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (typeof category !== "string" || !CATEGORIES.has(category as UploadCategory)) {
      return NextResponse.json({ error: "Invalid upload category" }, { status: 400 });
    }

    const uploadCategory = category as UploadCategory;

    // On Vercel without going through signed direct upload, keep under ~4MB
    if (process.env.VERCEL && file.size > 4 * 1024 * 1024) {
      if (isSupabaseStorageEnabled()) {
        return NextResponse.json(
          {
            error:
              "Large files must use direct cloud upload. Refresh the page and try again.",
            useDirectUpload: true,
          },
          { status: 413 }
        );
      }
      return NextResponse.json(
        {
          error:
            uploadCategory === "videos"
              ? "Videos over 4MB: paste a YouTube/Vimeo link, or configure Supabase Storage."
              : "File is over 4MB. Configure Supabase Storage for larger uploads.",
        },
        { status: 413 }
      );
    }

    const validationError = validateUploadFile(file, uploadCategory);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const saved = await saveUploadFile(file, uploadCategory);

    return NextResponse.json({
      success: true,
      url: saved.url,
      fileName: saved.fileName,
      size: saved.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[upload]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
