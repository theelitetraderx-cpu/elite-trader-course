"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import type { ModuleVideo, ModuleNote } from "@/lib/data/course-hierarchy";
import {
  getVideoEmbed,
  isPdfUrl,
  isPptUrl,
  isTextDocUrl,
  toAbsoluteUrl,
} from "@/lib/media/embed-url";
import { PptxViewer } from "@/components/student/pptx-viewer";
import { cn } from "@/lib/utils";

/** Large video area — top of lesson layout */
export function EmbeddedVideoPlayer({
  video,
  onWatchProgress,
}: {
  video: ModuleVideo;
  onWatchProgress?: (currentSeconds: number) => void;
}) {
  const embed = useMemo(
    () => getVideoEmbed(video.type, video.url),
    [video.type, video.url]
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  const skip = (seconds: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + seconds));
  };

  return (
    <div className="relative w-full aspect-video bg-black group">
      {!embed ? (
        <div className="absolute inset-0 flex items-center justify-center text-[#A8A8A8] text-sm px-4 text-center">
          Unable to load this video.
        </div>
      ) : embed.kind === "iframe" ? (
        <iframe
          src={embed.src}
          title={video.title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <>
          <video
            ref={videoRef}
            src={embed.src}
            controls
            controlsList="nodownload"
            className="absolute inset-0 w-full h-full"
            playsInline
            onTimeUpdate={(event) => {
              onWatchProgress?.(event.currentTarget.currentTime);
            }}
          />
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            <button
              type="button"
              onClick={() => skip(-10)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-black/70 text-white text-xs hover:bg-black/90"
              aria-label="Back 10 seconds"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              10s
            </button>
            <button
              type="button"
              onClick={() => skip(10)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-black/70 text-white text-xs hover:bg-black/90"
              aria-label="Forward 10 seconds"
            >
              10s
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function PdfEmbed({ fileUrl, title }: { fileUrl: string; title: string }) {
  const src = `${fileUrl}#toolbar=0&navpanes=0`;
  return (
    <iframe src={src} title={title} className="w-full h-full border-0 bg-white rounded-lg" />
  );
}

/** Slides area below video */
export function EmbeddedSlidesViewer({
  title,
  fileUrl,
}: {
  title: string;
  fileUrl: string;
}) {
  const isPdf = isPdfUrl(fileUrl);
  const isPpt = isPptUrl(fileUrl);

  return (
    <div className="w-full h-full min-h-[240px] rounded-lg overflow-hidden border border-[rgba(212,175,55,0.15)] bg-[#0a0a0a]">
      {isPdf && <PdfEmbed fileUrl={fileUrl} title={title} />}
      {isPpt && !isPdf && <PptxViewer fileUrl={fileUrl} className="h-full min-h-[240px]" />}
      {!isPdf && !isPpt && (
        <div className="h-full flex items-center justify-center text-[#A8A8A8] text-sm p-4 text-center">
          Preview not available for this file type.
        </div>
      )}
    </div>
  );
}

/** Read-only notes panel — fullStage expands PDF for the lesson player */
export function NoteSidebarContent({
  note,
  fullStage = false,
}: {
  note: ModuleNote;
  fullStage?: boolean;
}) {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const fileUrl = note.file_url ?? "";
  const hasFile = Boolean(fileUrl);
  const isPdf = hasFile && isPdfUrl(fileUrl);
  const isPpt = hasFile && isPptUrl(fileUrl);
  const isText = hasFile && isTextDocUrl(fileUrl);
  const fileHeight = fullStage ? "min(520px,65vh)" : "220px";

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--portal-border)] bg-[var(--portal-bg-elevated)] overflow-hidden flex flex-col",
        fullStage ? "min-h-[min(520px,65vh)]" : "min-h-[280px]"
      )}
    >
      <div className="px-4 py-3 border-b border-[var(--portal-border)] bg-[var(--portal-bg-subtle)]">
        <p className="text-[10px] uppercase tracking-wider text-[var(--portal-muted-2)] mb-1">
          Document
        </p>
        <p className="text-[var(--portal-fg)] text-sm font-medium">{note.title}</p>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {note.content ? (
          <div className={cn("p-4 overflow-y-auto", fullStage ? "flex-1" : "")}>
            <p className="text-[var(--portal-muted)] text-sm leading-relaxed whitespace-pre-wrap">
              {note.content}
            </p>
          </div>
        ) : null}

        {isPdf && (
          <div
            className="shrink-0 border-t border-[var(--portal-border)]"
            style={{ height: fileHeight }}
          >
            <PdfEmbed fileUrl={fileUrl} title={note.title} />
          </div>
        )}

        {isPpt && !isPdf && (
          <div
            className="shrink-0 border-t border-[var(--portal-border)]"
            style={{ height: fileHeight }}
          >
            <PptxViewer fileUrl={fileUrl} className="h-full" />
          </div>
        )}

        {isText && origin && (
          <div
            className="p-2 border-t border-[var(--portal-border)]"
            style={{ height: fullStage ? fileHeight : "180px" }}
          >
            <iframe
              src={toAbsoluteUrl(fileUrl, origin)}
              title={note.title}
              className="w-full h-full rounded border-0 bg-white"
            />
          </div>
        )}

        {!note.content && !hasFile && (
          <p className="p-6 text-[var(--portal-muted)] text-sm text-center">
            Empty document
          </p>
        )}
      </div>
    </div>
  );
}

/* Legacy full-card viewers (kept for compatibility) */
export function VideoViewer({ video }: { video: ModuleVideo }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[rgba(212,175,55,0.2)] bg-black">
      <EmbeddedVideoPlayer video={video} />
    </div>
  );
}

export function DocumentViewer({
  title,
  fileUrl,
}: {
  title: string;
  fileUrl: string;
}) {
  return (
    <div className="rounded-xl overflow-hidden border border-[rgba(212,175,55,0.2)] bg-[#101010]">
      <div className="px-4 py-3 border-b border-[rgba(212,175,55,0.12)]">
        <h4 className="text-white text-sm font-medium">{title}</h4>
      </div>
      <div className="p-4" style={{ height: "min(70vh, 560px)" }}>
        <EmbeddedSlidesViewer title={title} fileUrl={fileUrl} />
      </div>
    </div>
  );
}

export function NoteViewer({ note }: { note: ModuleNote }) {
  return <NoteSidebarContent note={note} />;
}
