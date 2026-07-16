"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  FileText,
  Layers,
  Play,
  Presentation,
  Sparkles,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CourseProgram, AdminModule } from "@/lib/data/course-hierarchy";
import { cn } from "@/lib/utils";
import { ModuleLessonView } from "@/components/student/module-lesson-view";
import { isPdfUrl } from "@/lib/media/embed-url";

interface StudentMaterialsProps {
  programs: CourseProgram[];
}

function moduleHasContent(mod: AdminModule) {
  return mod.videos.length > 0 || mod.ppts.length > 0 || mod.notes.length > 0;
}

function countModuleMedia(mod: AdminModule) {
  const videos = mod.videos.filter((v) => v.status !== "draft").length;
  const ppt = mod.ppts.filter((p) => !isPdfUrl(p.file_url)).length;
  const pdf =
    mod.notes.length + mod.ppts.filter((p) => isPdfUrl(p.file_url)).length;
  return { videos, ppt, pdf };
}

export function StudentMaterials({ programs }: StudentMaterialsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseParam = searchParams.get("course");
  const moduleParam = searchParams.get("module");

  const [activeCourseId, setActiveCourseId] = useState<string | null>(
    courseParam && programs.some((p) => p.id === courseParam) ? courseParam : null
  );
  const [activeModuleId, setActiveModuleId] = useState<string | null>(
    moduleParam ?? null
  );

  const activeProgram = useMemo(
    () => programs.find((p) => p.id === activeCourseId) ?? null,
    [programs, activeCourseId]
  );

  const publishedModules = useMemo(
    () => activeProgram?.modules.filter(moduleHasContent) ?? [],
    [activeProgram]
  );

  const activeModule = useMemo(
    () => publishedModules.find((m) => m.id === activeModuleId) ?? null,
    [publishedModules, activeModuleId]
  );

  const activeModuleIndex = publishedModules.findIndex(
    (m) => m.id === activeModuleId
  );

  const syncUrl = (courseId: string | null, moduleId: string | null) => {
    const params = new URLSearchParams();
    if (courseId) params.set("course", courseId);
    if (moduleId) params.set("module", moduleId);
    const qs = params.toString();
    router.replace(qs ? `/dashboard/notes?${qs}` : "/dashboard/notes", {
      scroll: false,
    });
  };

  useEffect(() => {
    if (courseParam && programs.some((p) => p.id === courseParam)) {
      setActiveCourseId(courseParam);
    }
  }, [courseParam, programs]);

  useEffect(() => {
    if (moduleParam) {
      setActiveModuleId(moduleParam);
      return;
    }
    if (!activeCourseId) return;
    setActiveModuleId((current) => {
      if (current) return current;
      const program = programs.find((p) => p.id === activeCourseId);
      return program?.modules.find(moduleHasContent)?.id ?? null;
    });
  }, [moduleParam, activeCourseId, programs]);

  const startCourse = (program: CourseProgram) => {
    const modules = program.modules.filter(moduleHasContent);
    const firstModule = modules[0] ?? null;
    setActiveCourseId(program.id);
    setActiveModuleId(firstModule?.id ?? null);
    syncUrl(program.id, firstModule?.id ?? null);
  };

  const openModule = (moduleId: string) => {
    setActiveModuleId(moduleId);
    if (activeCourseId) syncUrl(activeCourseId, moduleId);
  };

  const backToCourses = () => {
    setActiveCourseId(null);
    setActiveModuleId(null);
    syncUrl(null, null);
  };

  const goPrevModule = () => {
    if (activeModuleIndex <= 0) return;
    openModule(publishedModules[activeModuleIndex - 1].id);
  };

  const goNextModule = () => {
    if (activeModuleIndex < 0 || activeModuleIndex >= publishedModules.length - 1)
      return;
    openModule(publishedModules[activeModuleIndex + 1].id);
  };

  if (programs.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-elevated)] p-8 sm:p-16 text-center">
        <BookOpen className="w-12 h-12 text-[#D4AF37]/50 mx-auto mb-4" />
        <h3 className="text-[var(--portal-fg)] font-medium mb-2">No courses yet</h3>
        <p className="text-[var(--portal-muted)] text-sm max-w-md mx-auto">
          Contact support to get enrolled. Your courses will show up here.
        </p>
      </div>
    );
  }

  /* ── Course picker ── */
  if (!activeProgram) {
    return (
      <div className="space-y-6 sm:space-y-8 pb-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[#D4AF37] text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1.5 font-semibold">
            Learning
          </p>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-[var(--portal-fg)]">
            My Courses
          </h1>
          <p className="text-[var(--portal-muted)] text-sm mt-1.5 max-w-lg">
            Choose a course to start. Each module has Video, PPT, and PDF in separate tabs.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:gap-5">
          {programs.map((program, index) => {
            const modules = program.modules.filter(moduleHasContent);
            return (
              <motion.article
                key={program.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-elevated)] p-5 sm:p-6 hover:border-[#D4AF37]/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="gold">{program.title}</Badge>
                      <span className="text-xs text-[var(--portal-muted-2)]">
                        {modules.length} module{modules.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <h2 className="font-heading text-lg sm:text-xl font-semibold text-[var(--portal-fg)] mb-1.5">
                      {program.title}
                    </h2>
                    <p className="text-sm text-[var(--portal-muted)] leading-relaxed line-clamp-2">
                      {program.description}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-[var(--portal-muted-2)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Video
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Presentation className="w-3.5 h-3.5 text-[#D4AF37]" />
                        PPT
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                        PDF
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="gold"
                    size="md"
                    className="w-full sm:w-auto min-h-[48px] shrink-0"
                    onClick={() => startCourse(program)}
                    disabled={modules.length === 0}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {modules.length === 0 ? "Coming soon" : "Start course"}
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Course learning view ── */
  return (
    <div className="space-y-5 sm:space-y-6 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <button
          type="button"
          onClick={backToCourses}
          className="inline-flex items-center gap-2 text-sm text-[var(--portal-muted)] hover:text-[var(--portal-fg)] touch-target self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          All courses
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="gold">{activeProgram.title}</Badge>
            <span className="text-xs text-[var(--portal-muted-2)]">
              {publishedModules.length} modules
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-semibold text-[var(--portal-fg)]">
            {activeProgram.title}
          </h1>
          <p className="text-sm text-[var(--portal-muted)] mt-1 line-clamp-2">
            {activeProgram.description}
          </p>
        </div>
      </div>

      {publishedModules.length === 0 ? (
        <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-elevated)] p-10 text-center">
          <Layers className="w-10 h-10 text-[#D4AF37]/40 mx-auto mb-3" />
          <p className="text-[var(--portal-fg)] text-sm font-medium mb-1">
            No modules yet
          </p>
          <p className="text-[var(--portal-muted)] text-sm">
            Content will appear once your instructor publishes lessons.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] gap-4 sm:gap-5">
          {/* Module list */}
          <aside className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-bg-elevated)] overflow-hidden h-fit lg:sticky lg:top-20">
            <div className="px-4 py-3 border-b border-[var(--portal-border)] bg-[var(--portal-bg-subtle)]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--portal-muted-2)]">
                Modules
              </p>
            </div>
            <div className="p-2 max-h-[40vh] lg:max-h-[min(70vh,640px)] overflow-y-auto space-y-1">
              {publishedModules.map((mod, index) => {
                const counts = countModuleMedia(mod);
                const isActive = activeModuleId === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => openModule(mod.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors touch-target",
                      isActive
                        ? "bg-[#D4AF37]/12 ring-1 ring-[#D4AF37]/35"
                        : "hover:bg-[var(--portal-hover)]"
                    )}
                  >
                    <span
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                        isActive
                          ? "bg-[#D4AF37] text-[#050505]"
                          : "bg-[#D4AF37]/15 text-[#D4AF37]"
                      )}
                    >
                      {isActive ? <Play className="w-3.5 h-3.5 fill-current" /> : index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium leading-snug",
                          isActive
                            ? "text-[var(--portal-fg)]"
                            : "text-[var(--portal-fg)]"
                        )}
                      >
                        {mod.title}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {counts.videos > 0 && (
                          <span className="text-[10px] text-[var(--portal-muted-2)] inline-flex items-center gap-0.5">
                            <Video className="w-3 h-3 text-[#D4AF37]" />
                            {counts.videos}
                          </span>
                        )}
                        {counts.ppt > 0 && (
                          <span className="text-[10px] text-[var(--portal-muted-2)] inline-flex items-center gap-0.5">
                            <Presentation className="w-3 h-3 text-[#D4AF37]" />
                            {counts.ppt}
                          </span>
                        )}
                        {counts.pdf > 0 && (
                          <span className="text-[10px] text-[var(--portal-muted-2)] inline-flex items-center gap-0.5">
                            <FileText className="w-3 h-3 text-[#D4AF37]" />
                            {counts.pdf}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 shrink-0 mt-1",
                        isActive ? "text-[#D4AF37]" : "text-[var(--portal-muted-3)]"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Lesson player */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              {activeModule ? (
                <motion.div
                  key={activeModule.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <ModuleLessonView
                    module={activeModule}
                    courseId={activeProgram.id}
                    hasPrev={activeModuleIndex > 0}
                    hasNext={activeModuleIndex < publishedModules.length - 1}
                    onPrevModule={goPrevModule}
                    onNextModule={goNextModule}
                  />
                </motion.div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--portal-border)] bg-[var(--portal-bg-elevated)] p-10 sm:p-14 text-center">
                  <Sparkles className="w-10 h-10 text-[#D4AF37]/50 mx-auto mb-3" />
                  <p className="text-[var(--portal-fg)] font-medium mb-1">
                    Select a module
                  </p>
                  <p className="text-sm text-[var(--portal-muted)] max-w-sm mx-auto">
                    Pick a module from the list to open Video, PPT, and PDF content.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
