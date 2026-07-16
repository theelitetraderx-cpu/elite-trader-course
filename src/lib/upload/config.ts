export type UploadCategory = "videos" | "ppt" | "notes";

export const UPLOAD_CONFIG: Record<
  UploadCategory,
  { maxBytes: number; extensions: string[]; mimeTypes: string[] }
> = {
  videos: {
    maxBytes: 500 * 1024 * 1024,
    extensions: [".mp4", ".webm", ".mov", ".m4v"],
    mimeTypes: ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"],
  },
  ppt: {
    maxBytes: 50 * 1024 * 1024,
    extensions: [".ppt", ".pptx", ".pdf"],
    mimeTypes: [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/pdf",
    ],
  },
  notes: {
    maxBytes: 25 * 1024 * 1024,
    extensions: [".pdf", ".doc", ".docx", ".txt", ".md"],
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ],
  },
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getAcceptString(category: UploadCategory): string {
  const { extensions, mimeTypes } = UPLOAD_CONFIG[category];
  return [...extensions, ...mimeTypes].join(",");
}

export function validateUploadFile(
  file: File,
  category: UploadCategory
): string | null {
  const config = UPLOAD_CONFIG[category];
  if (file.size > config.maxBytes) {
    return `File too large. Max size is ${formatFileSize(config.maxBytes)}.`;
  }

  const name = file.name.toLowerCase();
  const extOk = config.extensions.some((ext) => name.endsWith(ext));
  const mimeOk =
    !file.type || config.mimeTypes.includes(file.type) || file.type === "application/octet-stream";

  if (!extOk && !mimeOk) {
    return `Invalid file type. Allowed: ${config.extensions.join(", ")}`;
  }

  return null;
}
