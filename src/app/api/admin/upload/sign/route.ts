import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  UPLOAD_CONFIG,
  formatFileSize,
  type UploadCategory,
} from "@/lib/upload/config";
import { makeUniqueUploadName } from "@/lib/upload/save-file";
import {
  createSupabaseSignedUpload,
  isSupabaseStorageEnabled,
} from "@/lib/upload/supabase-storage";

export const runtime = "nodejs";

const CATEGORIES = new Set<UploadCategory>(["videos", "ppt", "notes"]);

/** Create a direct-to-Supabase upload URL (bypasses Vercel 4.5MB body limit). */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  if (!isSupabaseStorageEnabled()) {
    return NextResponse.json(
      {
        error:
          "Cloud storage is not configured. Add Supabase service role key, then create the course-content bucket.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const category = body.category as UploadCategory;
    const fileName = String(body.fileName ?? "");
    const size = Number(body.size ?? 0);

    if (!CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Invalid upload category" }, { status: 400 });
    }
    if (!fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }

    const config = UPLOAD_CONFIG[category];
    if (size > config.maxBytes) {
      return NextResponse.json(
        {
          error: `File too large. Max size is ${formatFileSize(config.maxBytes)}.`,
        },
        { status: 400 }
      );
    }

    const uniqueName = makeUniqueUploadName(fileName);
    const signed = await createSupabaseSignedUpload(category, uniqueName);

    return NextResponse.json({
      success: true,
      signedUrl: signed.signedUrl,
      token: signed.token,
      path: signed.path,
      url: signed.contentUrl,
      fileName: uniqueName.replace(/^\d+-[a-z0-9]+-/i, "") || fileName,
      uniqueName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to prepare upload";
    console.error("[upload/sign]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
