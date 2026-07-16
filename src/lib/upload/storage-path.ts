import path from "path";
import type { UploadCategory } from "./config";

const isVercel = Boolean(process.env.VERCEL);

export const LEGACY_PUBLIC_UPLOADS = path.join(process.cwd(), "public", "uploads");

/** Private uploads — /tmp on Vercel (writable), local storage otherwise */
export const PRIVATE_UPLOADS = isVercel
  ? path.join("/tmp", "elite-trader-uploads")
  : path.join(process.cwd(), "storage", "uploads");

export function getPrivateUploadDir(category: UploadCategory): string {
  return path.join(PRIVATE_UPLOADS, category);
}

export function buildContentApiUrl(category: UploadCategory, fileName: string): string {
  return `/api/content/${category}/${encodeURIComponent(fileName)}`;
}

export function parseContentApiPath(
  category: string,
  encodedFileName: string
): { category: UploadCategory; fileName: string } | null {
  if (category !== "videos" && category !== "ppt" && category !== "notes") {
    return null;
  }
  const fileName = path.basename(decodeURIComponent(encodedFileName));
  if (!fileName || fileName.includes("..")) return null;
  return { category, fileName };
}

export function resolveUploadFileLocations(category: UploadCategory, fileName: string) {
  const safeName = path.basename(fileName);
  if (!safeName || safeName.includes("..")) return null;

  return {
    safeName,
    privatePath: path.join(getPrivateUploadDir(category), safeName),
    legacyPath: path.join(LEGACY_PUBLIC_UPLOADS, category, safeName),
  };
}

/** Normalize stored URLs to the protected content API path when possible. */
export function toProtectedContentUrl(storedUrl: string): string {
  if (storedUrl.startsWith("/api/content/")) return storedUrl;
  if (storedUrl.startsWith("http://") || storedUrl.startsWith("https://")) {
    return storedUrl;
  }

  const legacyMatch = storedUrl.match(/^\/uploads\/(videos|ppt|notes)\/(.+)$/);
  if (legacyMatch) {
    const [, category, fileName] = legacyMatch;
    return buildContentApiUrl(category as UploadCategory, decodeURIComponent(fileName));
  }

  return storedUrl;
}

export function extractUploadReference(url: string): {
  category: UploadCategory;
  fileName: string;
} | null {
  const apiMatch = url.match(/^\/api\/content\/(videos|ppt|notes)\/(.+)$/);
  if (apiMatch) {
    return {
      category: apiMatch[1] as UploadCategory,
      fileName: decodeURIComponent(apiMatch[2]),
    };
  }

  const legacyMatch = url.match(/^\/uploads\/(videos|ppt|notes)\/(.+)$/);
  if (legacyMatch) {
    return {
      category: legacyMatch[1] as UploadCategory,
      fileName: decodeURIComponent(legacyMatch[2]),
    };
  }

  return null;
}
