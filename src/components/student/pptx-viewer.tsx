"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { isPptxUrl, isLegacyPptUrl } from "@/lib/media/embed-url";
import { cn } from "@/lib/utils";

interface PptxViewerProps {
  fileUrl: string;
  className?: string;
}

export function PptxViewer({ fileUrl, className }: PptxViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<{ destroy: () => void; renderNextSlide: () => void; renderPreSlide: () => void; slideCount: number; currentIndex: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideCount, setSlideCount] = useState(0);

  useEffect(() => {
    if (isLegacyPptUrl(fileUrl)) {
      setError("Legacy .ppt files cannot be previewed in-browser. Ask your admin to upload .pptx or .pdf instead.");
      setLoading(false);
      return;
    }

    if (!isPptxUrl(fileUrl)) {
      setError("Unsupported slide format.");
      setLoading(false);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSlideIndex(0);
    setSlideCount(0);
    el.innerHTML = "";

    const load = async () => {
      try {
        const { init } = await import("pptx-preview");
        if (cancelled) return;

        const width = el.clientWidth || 800;
        const height = Math.round(Math.min(width * (9 / 16), 520));

        previewerRef.current?.destroy();
        const previewer = init(el, {
          width,
          height,
          mode: "slide",
        });
        previewerRef.current = previewer;

        const response = await fetch(fileUrl, { credentials: "same-origin" });
        if (!response.ok) {
          throw new Error("Could not load the presentation file.");
        }

        const buffer = await response.arrayBuffer();
        if (cancelled) return;

        await previewer.preview(buffer);
        if (cancelled) return;

        setSlideCount(previewer.slideCount);
        setSlideIndex(previewer.currentIndex ?? 0);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load presentation."
          );
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      previewerRef.current?.destroy();
      previewerRef.current = null;
    };
  }, [fileUrl]);

  const goPrev = () => {
    previewerRef.current?.renderPreSlide();
    setSlideIndex((i) => Math.max(0, i - 1));
  };

  const goNext = () => {
    previewerRef.current?.renderNextSlide();
    setSlideIndex((i) => Math.min(slideCount - 1, i + 1));
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-[#A8A8A8] text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
          Loading slides...
        </div>
      )}

      {error && (
        <div className="py-12 px-4 text-center text-[#A8A8A8] text-sm">{error}</div>
      )}

      <div
        ref={containerRef}
        className={cn(
          "pptx-viewer-root w-full overflow-auto flex justify-center",
          (loading || error) && "hidden"
        )}
      />

      {!loading && !error && slideCount > 1 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[rgba(212,175,55,0.12)] bg-[#101010]">
          <button
            type="button"
            onClick={goPrev}
            disabled={slideIndex <= 0}
            className="flex items-center gap-1 text-xs text-[#A8A8A8] hover:text-[#FFD700] disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-xs text-[#666] font-numbers">
            Slide {slideIndex + 1} / {slideCount}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={slideIndex >= slideCount - 1}
            className="flex items-center gap-1 text-xs text-[#A8A8A8] hover:text-[#FFD700] disabled:opacity-40"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
