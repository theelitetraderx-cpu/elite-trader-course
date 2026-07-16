import { createSupabaseAdmin } from "@/lib/supabase/client";
import { isSupabaseDataEnabled } from "@/lib/supabase/app-data";
import type { UploadCategory } from "@/lib/upload/config";
import { buildContentApiUrl } from "@/lib/upload/storage-path";

export const COURSE_CONTENT_BUCKET = "course-content";

export function isSupabaseStorageEnabled() {
  return isSupabaseDataEnabled();
}

export function storageObjectPath(category: UploadCategory, fileName: string) {
  return `${category}/${fileName}`;
}

export async function ensureCourseContentBucket(): Promise<boolean> {
  const supabase = createSupabaseAdmin();
  if (!supabase) return false;

  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === COURSE_CONTENT_BUCKET);
  if (exists) return true;

  const { error } = await supabase.storage.createBucket(COURSE_CONTENT_BUCKET, {
    public: false,
    fileSizeLimit: 524288000, // 500MB
  });

  if (error && !/already exists/i.test(error.message)) {
    console.warn("[storage] createBucket:", error.message);
    return false;
  }
  return true;
}

export async function uploadToSupabaseStorage(
  file: File | Buffer,
  category: UploadCategory,
  uniqueName: string,
  contentType?: string
): Promise<{ url: string; path: string }> {
  const supabase = createSupabaseAdmin();
  if (!supabase) throw new Error("Supabase storage is not configured");

  await ensureCourseContentBucket();

  const path = storageObjectPath(category, uniqueName);
  const body = file instanceof File ? file : file;
  const { error } = await supabase.storage
    .from(COURSE_CONTENT_BUCKET)
    .upload(path, body, {
      contentType:
        contentType ||
        (file instanceof File ? file.type : "application/octet-stream") ||
        "application/octet-stream",
      upsert: false,
    });

  if (error) throw new Error(error.message);

  return {
    path,
    url: buildContentApiUrl(category, uniqueName),
  };
}

export async function createSupabaseSignedUpload(
  category: UploadCategory,
  uniqueName: string
): Promise<{ signedUrl: string; path: string; token: string; contentUrl: string }> {
  const supabase = createSupabaseAdmin();
  if (!supabase) throw new Error("Supabase storage is not configured");

  await ensureCourseContentBucket();

  const path = storageObjectPath(category, uniqueName);
  const { data, error } = await supabase.storage
    .from(COURSE_CONTENT_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create upload URL");
  }

  return {
    signedUrl: data.signedUrl,
    path: data.path,
    token: data.token,
    contentUrl: buildContentApiUrl(category, uniqueName),
  };
}

export async function downloadFromSupabaseStorage(
  category: UploadCategory,
  fileName: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const supabase = createSupabaseAdmin();
  if (!supabase) return null;

  const path = storageObjectPath(category, fileName);
  const { data, error } = await supabase.storage
    .from(COURSE_CONTENT_BUCKET)
    .download(path);

  if (error || !data) return null;

  const arrayBuffer = await data.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: data.type || "application/octet-stream",
  };
}

export async function supabaseObjectExists(
  category: UploadCategory,
  fileName: string
): Promise<boolean> {
  const supabase = createSupabaseAdmin();
  if (!supabase) return false;

  const { data, error } = await supabase.storage
    .from(COURSE_CONTENT_BUCKET)
    .list(category, { search: fileName, limit: 1 });

  if (error) return false;
  return Boolean(data?.some((item) => item.name === fileName));
}
