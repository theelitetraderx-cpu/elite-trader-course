"use client";

import { Maximize2 } from "lucide-react";
import type { ModuleNote } from "@/lib/data/course-hierarchy";
import { cn } from "@/lib/utils";
import { NoteSidebarContent } from "@/components/student/content-viewers";

interface NotesSidebarProps {
  notes: ModuleNote[];
  selectedNote: ModuleNote | null;
  onSelectNote: (id: string) => void;
}

export function NotesSidebar({
  notes,
  selectedNote,
  onSelectNote,
}: NotesSidebarProps) {
  const toggleFullscreen = (el: HTMLElement | null) => {
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen?.();
    }
  };

  return (
    <div
      data-lesson-notes
      className="flex flex-col min-h-[280px] xl:min-h-0 bg-[#101010]"
    >
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 border-b border-[rgba(212,175,55,0.12)]">
        <h4 className="text-sm font-semibold text-white">Lesson Notes</h4>
        <button
          type="button"
          onClick={(e) =>
            toggleFullscreen(
              e.currentTarget.closest("[data-lesson-notes]") as HTMLElement
            )
          }
          className="touch-target flex items-center justify-center p-2 text-[#A8A8A8] hover:text-[#FFD700] rounded-lg"
          aria-label="Fullscreen notes"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {notes.length > 1 && (
        <div className="flex gap-2 p-2 border-b border-[rgba(212,175,55,0.08)] overflow-x-auto hide-scrollbar">
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => onSelectNote(note.id)}
              className={cn(
                "shrink-0 px-3 py-2 rounded-lg text-xs max-w-[160px] truncate touch-target transition-colors",
                selectedNote?.id === note.id
                  ? "bg-[#D4AF37]/15 text-[#FFD700] ring-1 ring-[#D4AF37]/30"
                  : "text-[#A8A8A8] bg-[#0a0a0a] active:bg-white/5"
              )}
            >
              {note.title}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {selectedNote ? (
          <NoteSidebarContent note={selectedNote} />
        ) : (
          <div className="h-full min-h-[180px] flex items-center justify-center text-[#666] text-sm text-center px-4">
            No notes for this module yet
          </div>
        )}
      </div>
    </div>
  );
}
