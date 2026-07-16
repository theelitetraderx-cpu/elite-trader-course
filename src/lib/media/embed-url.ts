import type { VideoType } from "@/types";

export function getYoutubeEmbedUrl(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtu\.be\/([^?&]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}

export function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match?.[1] ? `https://player.vimeo.com/video/${match[1]}` : null;
}

export function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

export function isPptUrl(url: string): boolean {
  return /\.(ppt|pptx)(\?|$)/i.test(url);
}

export function isPptxUrl(url: string): boolean {
  return /\.pptx(\?|$)/i.test(url);
}

export function isLegacyPptUrl(url: string): boolean {
  return /\.ppt(\?|$)/i.test(url) && !isPptxUrl(url);
}

export function isTextDocUrl(url: string): boolean {
  return /\.(txt|md)(\?|$)/i.test(url);
}

export function toAbsoluteUrl(pathOrUrl: string, origin: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return `${origin}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

export function getDocumentViewerUrl(fileUrl: string, origin: string): string {
  const absolute = toAbsoluteUrl(fileUrl, origin);

  if (isPdfUrl(absolute)) {
    return `${absolute}#toolbar=0&navpanes=0`;
  }

  // PPTX is rendered client-side via pptx-preview — not Office Online embed
  return absolute;
}

export function getVideoEmbed(
  type: VideoType,
  url: string
): { kind: "iframe"; src: string } | { kind: "video"; src: string } | null {
  if (type === "youtube") {
    const embed = getYoutubeEmbedUrl(url);
    return embed ? { kind: "iframe", src: embed } : null;
  }
  if (type === "vimeo") {
    const embed = getVimeoEmbedUrl(url);
    return embed ? { kind: "iframe", src: embed } : null;
  }
  if (type === "mp4" || url.startsWith("/api/content/") || url.startsWith("/uploads/") || url.endsWith(".mp4")) {
    return { kind: "video", src: url };
  }
  if (type === "hls" || url.endsWith(".m3u8")) {
    return { kind: "video", src: url };
  }
  const yt = getYoutubeEmbedUrl(url);
  if (yt) return { kind: "iframe", src: yt };
  const vimeo = getVimeoEmbedUrl(url);
  if (vimeo) return { kind: "iframe", src: vimeo };
  if (url.startsWith("http")) return { kind: "iframe", src: url };
  return { kind: "video", src: url };
}

export function formatVideoDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
