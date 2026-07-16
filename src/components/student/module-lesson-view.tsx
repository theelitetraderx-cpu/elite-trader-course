"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Maximize2,
  Play,
  Presentation,
} from "lucide-react";
import type { AdminModule } from "@/lib/data/course-hierarchy";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  EmbeddedVideoPlayer,
  EmbeddedSlidesViewer,
  NoteSidebarContent,
} from "@/components/student/content-viewers";
import { isPdfUrl } from "@/lib/media/embed-url";

type LessonTab = "video" | "ppt" | "pdf";

interface ModuleLessonViewProps {
  module: AdminModule;
  courseId: string;
  className?: string;
  onPrevModule?: () => void;
  onNextModule?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function ModuleLessonView({
  module,
  courseId,
  className,
  onPrevModule,
  onNextModule,
  hasPrev,
  hasNext,
}: ModuleLessonViewProps) {
  const videos = useMemo(
    () => module.videos.filter((v) => v.status !== "draft"),
    [module.videos]
  );
  const pptItems = useMemo(
    () => module.ppts.filter((p) => !isPdfUrl(p.file_url)),
    [module.ppts]
  );
  const pdfItems = useMemo(() => {
    const fromPpts = module.ppts
      .filter((p) => isPdfUrl(p.file_url))
      .map((p) => ({
        id: `ppt-pdf-${p.id}`,
        title: p.title,
        content: "",
        file_url: p.file_url,
        kind: "ppt-pdf" as const,
      }));
    const fromNotes = module.notes.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      file_url: n.file_url,
      kind: "note" as const,
      note: n,
    }));
    return [...fromPpts, ...fromNotes];
  }, [module.ppts, module.notes]);

  const availableTabs = useMemo(() => {
    const tabs: { id: LessonTab; label: string; icon: typeof Play; count: number }[] =
      [];
    if (videos.length > 0) {
      tabs.push({ id: "video", label: "Video", icon: Play, count: videos.length });
    }
    if (pptItems.length > 0) {
      tabs.push({ id: "ppt", label: "PPT", icon: Presentation, count: pptItems.length });
    }
    if (pdfItems.length > 0) {
      tabs.push({ id: "pdf", label: "PDF", icon: FileText, count: pdfItems.length });
    }
    return tabs;
  }, [videos.length, pptItems.length, pdfItems.length]);

  const [activeTab, setActiveTab] = useState<LessonTab>("video");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedPptId, setSelectedPptId] = useState<string | null>(null);
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const lastReportedRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const publishedVideos = module.videos.filter((v) => v.status !== "draft");
    const ppts = module.ppts.filter((p) => !isPdfUrl(p.file_url));
    const pdfsFromPpts = module.ppts.filter((p) => isPdfUrl(p.file_url));
    const firstTab: LessonTab = publishedVideos.length
      ? "video"
      : ppts.length
        ? "ppt"
        : "pdf";

    setActiveTab(firstTab);
    setSelectedVideoId(publishedVideos[0]?.id ?? null);
    setSelectedPptId(ppts[0]?.id ?? null);
    setSelectedPdfId(
      pdfsFromPpts[0]
        ? `ppt-pdf-${pdfsFromPpts[0].id}`
        : module.notes[0]?.id ?? null
    );
    setCompleted(false);
    lastReportedRef.current = 0;

    let cancelled = false;
    fetch("/api/student/progress")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const record = data.progress?.find(
          (item: { module_id: string; completed: boolean }) =>
            item.module_id === module.id
        );
        if (record?.completed) setCompleted(true);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [module]);

  const selectedVideo = useMemo(
    () => videos.find((v) => v.id === selectedVideoId) ?? videos[0] ?? null,
    [videos, selectedVideoId]
  );
  const selectedPpt = useMemo(
    () => pptItems.find((p) => p.id === selectedPptId) ?? pptItems[0] ?? null,
    [pptItems, selectedPptId]
  );
  const selectedPdf = useMemo(
    () => pdfItems.find((p) => p.id === selectedPdfId) ?? pdfItems[0] ?? null,
    [pdfItems, selectedPdfId]
  );

  const reportWatchTime = useCallback(
    async (seconds: number) => {
      if (seconds < 15) return;
      await fetch("/api/student/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "watch_time",
          course_id: courseId,
          module_id: module.id,
          seconds,
        }),
      });
    },
    [courseId, module.id]
  );

  const handleWatchProgress = useCallback(
    (currentSeconds: number) => {
      const delta = currentSeconds - lastReportedRef.current;
      if (delta >= 30) {
        lastReportedRef.current = currentSeconds;
        void reportWatchTime(30);
      }
    },
    [reportWatchTime]
  );

  const handleMarkComplete = async () => {
    setMarkingComplete(true);
    try {
      const res = await fetch("/api/student/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_module",
          course_id: courseId,
          module_id: module.id,
        }),
      });
      if (res.ok) setCompleted(true);
    } finally {
      setMarkingComplete(false);
    }
  };

  const toggleFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen?.();
    }
  };

  const itemPicker = (
    items: { id: string; title: string }[],
    selectedId: string | null,
    onSelect: (id: string) => void
  ) => {
    if (items.length <= 1) return null;
    return (
      <div className="flex gap-2 px-3 sm:px-4 py-2.5 overflow-x-auto hide-scrollbar border-b border-[var(--portal-border)] bg-[var(--portal-bg-subtle)]">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium touch-target transition-colors",
              selectedId === item.id
                ? "bg-[#D4AF37]/20 text-[#B8860B] dark:text-[#FFD700] ring-1 ring-[#D4AF37]/35"
                : "text-[var(--portal-muted)] bg-[var(--portal-bg-elevated)] hover:text-[var(--portal-fg)]"
            )}
          >
            <span className="w-5 h-5 rounded-md bg-[#D4AF37]/15 text-[#D4AF37] text-[10px] font-bold flex items-center justify-center">
              {index + 1}
            </span>
            <span className="max-w-[140px] truncate">{item.title}</span>
          </button>
        ))}
      </div>
    );
  };

  const emptyState = (label: string, Icon: typeof Play) => (
    <div className="flex flex-col items-center justify-center gap-3 min-h-[280px] sm:min-h-[360px] text-[var(--portal-muted)] px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center">
        <Icon className="w-7 h-7 text-[#D4AF37]/50" />
      </div>
      <p className="text-sm font-medium text-[var(--portal-fg)]">No {label} yet</p>
      <p className="text-xs max-w-xs">
        Content for this section will appear here when your instructor adds it.
      </p>
    </div>
  );

  return (
    <div
      ref={stageRef}
      className={cn(
        "rounded-2xl overflow-hidden border border-[var(--portal-border)] bg-[var(--portal-bg-elevated)] shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-[var(--portal-border)] bg-[var(--portal-bg-elevated)]">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#D4AF37] font-semibold mb-0.5">
            Module lesson
          </p>
          <h3 className="font-heading text-base sm:text-lg font-semibold text-[var(--portal-fg)] leading-snug truncate">
            {module.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(hasPrev || hasNext) && (
            <div className="flex items-center gap-1 mr-1">
              <button
                type="button"
                onClick={onPrevModule}
                disabled={!hasPrev}
                className="touch-target p-2 rounded-lg text-[var(--portal-muted)] hover:text-[var(--portal-fg)] disabled:opacity-30"
                aria-label="Previous module"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNextModule}
                disabled={!hasNext}
                className="touch-target p-2 rounded-lg text-[var(--portal-muted)] hover:text-[var(--portal-fg)] disabled:opacity-30"
                aria-label="Next module"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          {completed ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-500/10 px-3 py-2 rounded-xl font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkComplete}
              disabled={markingComplete}
              className="text-xs min-h-[40px]"
            >
              {markingComplete ? "Saving…" : "Mark complete"}
            </Button>
          )}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="touch-target flex items-center justify-center p-2.5 text-[var(--portal-muted)] hover:text-[#D4AF37] rounded-xl"
            aria-label="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video / PPT / PDF tabs */}
      {availableTabs.length > 0 ? (
        <div className="flex gap-1 p-1.5 mx-3 sm:mx-4 mt-3 rounded-2xl bg-[var(--portal-bg-subtle)] border border-[var(--portal-border)]">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium touch-target transition-all",
                activeTab === tab.id
                  ? "bg-[var(--portal-bg-elevated)] text-[var(--portal-fg)] shadow-sm ring-1 ring-[#D4AF37]/35"
                  : "text-[var(--portal-muted)] hover:text-[var(--portal-fg)]"
              )}
            >
              <tab.icon
                className={cn(
                  "w-4 h-4",
                  activeTab === tab.id ? "text-[#D4AF37]" : "opacity-70"
                )}
              />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-md",
                  activeTab === tab.id
                    ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                    : "bg-[var(--portal-bg-elevated)] text-[var(--portal-muted-2)]"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {/* Stage */}
      <div className="mt-3">
        {availableTabs.length === 0 && emptyState("content", Play)}

        {activeTab === "video" && (
          <>
            {itemPicker(videos, selectedVideoId, setSelectedVideoId)}
            {selectedVideo ? (
              <div className="bg-black">
                <EmbeddedVideoPlayer
                  video={selectedVideo}
                  onWatchProgress={handleWatchProgress}
                />
              </div>
            ) : (
              emptyState("video", Play)
            )}
          </>
        )}

        {activeTab === "ppt" && (
          <>
            {itemPicker(pptItems, selectedPptId, setSelectedPptId)}
            <div className="p-3 sm:p-4 bg-[var(--portal-bg-subtle)]">
              {selectedPpt ? (
                <div className="h-[min(520px,65vh)] rounded-xl overflow-hidden">
                  <EmbeddedSlidesViewer
                    title={selectedPpt.title}
                    fileUrl={selectedPpt.file_url}
                  />
                </div>
              ) : (
                emptyState("PPT", Presentation)
              )}
            </div>
          </>
        )}

        {activeTab === "pdf" && (
          <>
            {itemPicker(
              pdfItems.map((p) => ({ id: p.id, title: p.title })),
              selectedPdfId,
              setSelectedPdfId
            )}
            <div className="p-3 sm:p-4 bg-[var(--portal-bg-subtle)]">
              {selectedPdf ? (
                selectedPdf.kind === "note" && selectedPdf.note ? (
                  <div className="min-h-[min(520px,65vh)]">
                    <NoteSidebarContent note={selectedPdf.note} fullStage />
                  </div>
                ) : selectedPdf.file_url ? (
                  <div className="h-[min(520px,65vh)] rounded-xl overflow-hidden">
                    <EmbeddedSlidesViewer
                      title={selectedPdf.title}
                      fileUrl={selectedPdf.file_url}
                    />
                  </div>
                ) : (
                  emptyState("PDF", FileText)
                )
              ) : (
                emptyState("PDF", FileText)
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
