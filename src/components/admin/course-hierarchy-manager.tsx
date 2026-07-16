"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Video,
  Presentation,
  FileText,
  Trash2,
  Layers,
  BookOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  GraduationCap,
  Crown,
  Upload,
  Link2,
  FolderOpen,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getInitialPrograms,
  uid,
  type CourseProgram,
  type AdminModule,
  type ProgramSlug,
  type ModuleVideo,
  type ModulePPT,
  type ModuleNote,
} from "@/lib/data/course-hierarchy";
import type { VideoType } from "@/types";
import { cn } from "@/lib/utils";
import { FileUploadField } from "@/components/admin/file-upload-field";
import { UPLOAD_CONFIG, formatFileSize } from "@/lib/upload/config";

type ContentTab = "videos" | "ppt" | "notes";
type InputMode = "upload" | "url";

const PROGRAM_META: Record<
  ProgramSlug,
  { icon: typeof BookOpen; accent: string; presets: string[] }
> = {
  foundation: {
    icon: GraduationCap,
    accent: "border-emerald-500/40 bg-emerald-500/5",
    presets: ["Crypto Basics", "Binance Setup", "Spot Trading", "Risk Management"],
  },
  pro: {
    icon: Sparkles,
    accent: "border-[#D4AF37]/40 bg-[#D4AF37]/5",
    presets: ["Futures Trading", "Technical Analysis", "Live Signals", "Trade Management"],
  },
  elite: {
    icon: Crown,
    accent: "border-purple-500/40 bg-purple-500/5",
    presets: ["A+ Setups", "Advanced Strategy", "Private Community", "Priority Q&A"],
  },
};

const STEPS = [
  { n: 1, label: "Pick Program", hint: "Foundation, PRO or ELITE" },
  { n: 2, label: "Add Module", hint: "Create lesson sections" },
  { n: 3, label: "Add Content", hint: "Videos, slides & notes" },
];

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function totalStats(p: CourseProgram) {
  let videos = 0;
  let ppts = 0;
  let notes = 0;
  p.modules.forEach((m) => {
    videos += m.videos.length;
    ppts += m.ppts.length;
    notes += m.notes.length;
  });
  return { modules: p.modules.length, videos, ppts, notes };
}

export function CourseHierarchyManager() {
  const [programs, setPrograms] = useState<CourseProgram[]>(getInitialPrograms);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeProgram, setActiveProgram] = useState<ProgramSlug>("foundation");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [contentTab, setContentTab] = useState<ContentTab>("videos");
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(
    new Set(["foundation"])
  );

  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDesc, setModuleDesc] = useState("");

  const [showContentForm, setShowContentForm] = useState(false);
  const [contentTitle, setContentTitle] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [contentText, setContentText] = useState("");
  const [videoType, setVideoType] = useState<VideoType>("mp4");
  const [videoDuration, setVideoDuration] = useState("15");
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const resetContentForm = () => {
    setContentTitle("");
    setContentUrl("");
    setContentText("");
    setVideoType("mp4");
    setVideoDuration("15");
    setInputMode("upload");
    setUploadedFileUrl(null);
    setUploadedFileName(null);
    setFormError(null);
    setShowContentForm(false);
  };

  const handleUploaded = (url: string, fileName: string) => {
    setUploadedFileUrl(url);
    setUploadedFileName(fileName);
    setContentUrl(url);
    if (contentTab === "videos") setVideoType("mp4");
    if (!contentTitle.trim()) {
      const baseName = fileName.replace(/\.[^.]+$/, "");
      setContentTitle(baseName.replace(/[_-]/g, " "));
    }
  };

  const clearUpload = () => {
    setUploadedFileUrl(null);
    setUploadedFileName(null);
    setContentUrl("");
  };

  useEffect(() => {
    fetch("/api/admin/courses")
      .then((res) => res.json())
      .then((data) => {
        if (data.programs) setPrograms(data.programs);
      })
      .catch(() => setSaveError("Failed to load course content"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const persistPrograms = useCallback(
    async (next: CourseProgram[]): Promise<boolean> => {
      setSaving(true);
      setSaveError(null);
      try {
        const res = await fetch("/api/admin/courses", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ programs: next }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to save");
        if (data.programs) setPrograms(data.programs);
        return true;
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to save");
        return false;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const updateProgram = (slug: ProgramSlug, updater: (p: CourseProgram) => CourseProgram) => {
    setPrograms((prev) => {
      const previous = prev;
      const next = prev.map((p) => (p.slug === slug ? updater(p) : p));
      void persistPrograms(next).then((ok) => {
        if (!ok) setPrograms(previous);
      });
      return next;
    });
  };

  const program = useMemo(
    () => programs.find((p) => p.slug === activeProgram)!,
    [programs, activeProgram]
  );

  const selectedModule = useMemo(
    () => program.modules.find((m) => m.id === selectedModuleId) ?? null,
    [program, selectedModuleId]
  );

  const platformStats = useMemo(() => {
    return programs.reduce(
      (acc, p) => {
        const s = totalStats(p);
        acc.modules += s.modules;
        acc.videos += s.videos;
        acc.ppts += s.ppts;
        acc.notes += s.notes;
        return acc;
      },
      { modules: 0, videos: 0, ppts: 0, notes: 0 }
    );
  }, [programs]);

  const programStats = totalStats(program);
  const programMeta = PROGRAM_META[activeProgram];

  const addModule = (title?: string, desc?: string) => {
    const finalTitle = (title ?? moduleTitle).trim();
    if (!finalTitle) return;
    const newMod: AdminModule = {
      id: uid("mod"),
      course_id: program.id,
      title: finalTitle,
      description: (desc ?? moduleDesc).trim() || undefined,
      order_index: program.modules.length + 1,
      videos: [],
      ppts: [],
      notes: [],
      created_at: new Date().toISOString(),
    };
    updateProgram(activeProgram, (p) => ({
      ...p,
      modules: [...p.modules, newMod],
    }));
    setSelectedModuleId(newMod.id);
    setModuleTitle("");
    setModuleDesc("");
    setShowModuleForm(false);
    setSuccess(`Module "${finalTitle}" created. Now add videos, slides, or notes.`);
  };

  const deleteModule = (moduleId: string) => {
    if (!confirm("Delete this module and all its content?")) return;
    updateProgram(activeProgram, (p) => ({
      ...p,
      modules: p.modules.filter((m) => m.id !== moduleId),
    }));
    if (selectedModuleId === moduleId) setSelectedModuleId(null);
    setSuccess("Module deleted.");
  };

  const addContent = () => {
    if (!selectedModule || !contentTitle.trim()) {
      setFormError("Title is required.");
      return;
    }

    setFormError(null);
    let finalUrl = contentUrl.trim();

    if (contentTab === "videos") {
      if (inputMode === "upload") {
        if (!uploadedFileUrl) {
          setFormError("Please upload a video file or switch to external URL.");
          return;
        }
        finalUrl = uploadedFileUrl;
      } else if (!finalUrl) {
        setFormError("Please enter a video URL.");
        return;
      }
    }

    if (contentTab === "ppt") {
      if (inputMode === "upload") {
        if (!uploadedFileUrl) {
          setFormError("Please upload a PPT/PDF file or switch to file URL.");
          return;
        }
        finalUrl = uploadedFileUrl;
      } else if (!finalUrl) {
        setFormError("Please enter a file URL.");
        return;
      }
    }

    if (contentTab === "notes") {
      if (!contentText.trim() && !uploadedFileUrl) {
        setFormError("Add note text and/or upload a document.");
        return;
      }
    }

    updateProgram(activeProgram, (p) => ({
      ...p,
      modules: p.modules.map((m) => {
        if (m.id !== selectedModule.id) return m;
        const now = new Date().toISOString();

        if (contentTab === "videos") {
          const video: ModuleVideo = {
            id: uid("vid"),
            module_id: m.id,
            title: contentTitle.trim(),
            type: videoType,
            url: finalUrl,
            duration_seconds: parseInt(videoDuration, 10) * 60 || 900,
            status: "published",
            created_at: now,
          };
          return { ...m, videos: [...m.videos, video] };
        }
        if (contentTab === "ppt") {
          const ppt: ModulePPT = {
            id: uid("ppt"),
            module_id: m.id,
            title: contentTitle.trim(),
            file_url: finalUrl,
            is_downloadable: true,
            created_at: now,
          };
          return { ...m, ppts: [...m.ppts, ppt] };
        }
        const note: ModuleNote = {
          id: uid("note"),
          module_id: m.id,
          title: contentTitle.trim(),
          content: contentText.trim(),
          file_url: uploadedFileUrl || undefined,
          is_downloadable: true,
          created_at: now,
        };
        return { ...m, notes: [...m.notes, note] };
      }),
    }));

    const label =
      contentTab === "videos" ? "Video" : contentTab === "ppt" ? "Slide deck" : "Note";
    setSuccess(`${label} "${contentTitle.trim()}" added to ${selectedModule.title}.`);
    resetContentForm();
  };

  const deleteContent = (type: ContentTab, id: string) => {
    if (!selectedModule) return;
    updateProgram(activeProgram, (p) => ({
      ...p,
      modules: p.modules.map((m) => {
        if (m.id !== selectedModule.id) return m;
        if (type === "videos") return { ...m, videos: m.videos.filter((v) => v.id !== id) };
        if (type === "ppt") return { ...m, ppts: m.ppts.filter((v) => v.id !== id) };
        return { ...m, notes: m.notes.filter((v) => v.id !== id) };
      }),
    }));
  };

  const switchProgram = (slug: ProgramSlug) => {
    setActiveProgram(slug);
    const first = programs.find((p) => p.slug === slug)?.modules[0]?.id ?? null;
    setSelectedModuleId(first);
    setShowModuleForm(false);
    setResetContentOnSwitch();
  };

  const setResetContentOnSwitch = () => {
    resetContentForm();
  };

  const currentStep = !selectedModule ? (program.modules.length ? 2 : 1) : 3;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--portal-fg,#fff)] flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-[#D4AF37]" />
          Course Builder
        </h1>
        <p className="text-[var(--portal-muted,#A8A8A8)] text-sm mt-1">
          Build Foundation, PRO & ELITE — modules first, then add videos, slides and notes
        </p>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Modules", value: platformStats.modules, icon: Layers },
          { label: "Videos", value: platformStats.videos, icon: Video },
          { label: "Slides", value: platformStats.ppts, icon: Presentation },
          { label: "Notes", value: platformStats.notes, icon: FileText },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card p-3 sm:p-4 text-center">
              <Icon className="w-4 h-4 text-[#D4AF37] mx-auto mb-2" />
              <p className="font-numbers text-xl sm:text-2xl font-bold text-[#FFD700]">
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--portal-muted-2,#666)] mt-0.5">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Status alerts */}
      {(loading || saving) && (
        <div className="glass-card p-3 flex items-center gap-2 text-[var(--portal-muted,#A8A8A8)] text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
          {loading ? "Loading course content..." : "Saving changes..."}
        </div>
      )}

      {success && (
        <div className="glass-card p-4 border-green-500/30 bg-green-500/5 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <p className="text-green-400 text-sm flex-1">{success}</p>
          <button type="button" onClick={() => setSuccess(null)} aria-label="Dismiss">
            <X className="w-4 h-4 text-green-400/70" />
          </button>
        </div>
      )}

      {saveError && (
        <div className="glass-card p-4 border-red-500/30 bg-red-500/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm flex-1">{saveError}</p>
          <button type="button" onClick={() => setSaveError(null)} aria-label="Dismiss">
            <X className="w-4 h-4 text-red-400/70" />
          </button>
        </div>
      )}

      {/* Step guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {STEPS.map((step) => {
          const active = currentStep === step.n;
          const done = currentStep > step.n;
          return (
            <div
              key={step.n}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                active
                  ? "border-[#D4AF37]/50 bg-[#D4AF37]/8"
                  : done
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-[var(--portal-border,rgba(212,175,55,0.15))]"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                  active
                    ? "bg-[#D4AF37] text-[#050505]"
                    : done
                      ? "bg-green-500/20 text-green-400"
                      : "bg-[var(--portal-bg-elevated,#101010)] text-[var(--portal-muted,#A8A8A8)]"
                )}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : step.n}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--portal-fg,#fff)]">{step.label}</p>
                <p className="text-[11px] text-[var(--portal-muted-2,#666)]">{step.hint}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Program selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {programs.map((p) => {
          const stats = totalStats(p);
          const active = activeProgram === p.slug;
          const meta = PROGRAM_META[p.slug];
          const Icon = meta.icon;
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => switchProgram(p.slug)}
              className={cn(
                "flex flex-col p-4 sm:p-5 rounded-xl border text-left transition-all",
                active
                  ? cn("border-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.12)]", meta.accent)
                  : "border-[var(--portal-border,rgba(212,175,55,0.2))] hover:border-[#D4AF37]/30 bg-[var(--portal-bg-elevated,#101010)]"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <Badge variant={active ? "gold" : "default"}>{p.title}</Badge>
                </div>
                <span className="font-numbers text-[#FFD700] font-bold">${p.member_price}</span>
              </div>
              <p className="text-[var(--portal-muted,#A8A8A8)] text-xs line-clamp-2 mb-3">
                {p.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {[
                  { label: `${stats.modules} mod`, icon: Layers },
                  { label: `${stats.videos} vid`, icon: Video },
                  { label: `${stats.ppts} ppt`, icon: Presentation },
                  { label: `${stats.notes} notes`, icon: FileText },
                ].map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[var(--portal-bg-subtle,#0a0a0a)] text-[var(--portal-muted,#A8A8A8)] border border-[var(--portal-border,rgba(212,175,55,0.1))]"
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr_240px] gap-5 items-start">
        {/* Modules sidebar */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="font-heading text-sm font-semibold text-[var(--portal-fg,#fff)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D4AF37]" />
              {program.title} Modules
            </h2>
            <Button variant="gold" size="sm" onClick={() => setShowModuleForm((v) => !v)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {showModuleForm && (
            <div className="mb-4 p-3 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 space-y-3">
              <p className="text-xs font-medium text-[#FFD700]">New module</p>
              <Input
                label="Title"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                placeholder="e.g. Futures Trading"
              />
              <Input
                label="Description (optional)"
                value={moduleDesc}
                onChange={(e) => setModuleDesc(e.target.value)}
                placeholder="What students will learn"
              />
              <div className="flex flex-wrap gap-1.5">
                {programMeta.presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setModuleTitle(preset)}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors",
                      moduleTitle === preset
                        ? "bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#FFD700]"
                        : "border-[var(--portal-border,rgba(212,175,55,0.15))] text-[var(--portal-muted,#A8A8A8)]"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="gold" size="sm" onClick={() => addModule()} className="flex-1">
                  Create
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowModuleForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {program.modules.length === 0 ? (
              <div className="text-center py-8 px-2">
                <FolderOpen className="w-8 h-8 text-[#D4AF37]/40 mx-auto mb-2" />
                <p className="text-[var(--portal-muted,#A8A8A8)] text-xs mb-3">
                  No modules yet — tap + to create one
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {programMeta.presets.slice(0, 2).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => addModule(preset)}
                      className="px-2 py-1 rounded-lg text-[10px] border border-[#D4AF37]/30 text-[#FFD700] hover:bg-[#D4AF37]/10"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              program.modules.map((mod, i) => {
                const selected = selectedModuleId === mod.id;
                const contentCount =
                  mod.videos.length + mod.ppts.length + mod.notes.length;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => {
                      setSelectedModuleId(mod.id);
                      resetContentForm();
                    }}
                    className={cn(
                      "w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all",
                      selected
                        ? "border-[#D4AF37] bg-[#D4AF37]/8"
                        : "border-[var(--portal-border,rgba(212,175,55,0.15))] hover:border-[#D4AF37]/30"
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--portal-fg,#fff)] truncate">
                        {mod.title}
                      </p>
                      <p className="text-[10px] text-[var(--portal-muted-2,#666)] mt-0.5">
                        {contentCount === 0
                          ? "Empty — add content →"
                          : `${mod.videos.length} vid · ${mod.ppts.length} ppt · ${mod.notes.length} notes`}
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 shrink-0",
                        selected ? "text-[#FFD700]" : "text-[var(--portal-muted-2,#666)]"
                      )}
                    />
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Content editor */}
        <div className="min-w-0">
          {!selectedModule ? (
            <Card className="p-10 sm:p-14 text-center min-h-[360px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-4">
                <Layers className="w-8 h-8 text-[#D4AF37]/60" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-[var(--portal-fg,#fff)] mb-2">
                {program.modules.length === 0
                  ? "Create your first module"
                  : "Select a module"}
              </h3>
              <p className="text-[var(--portal-muted,#A8A8A8)] text-sm max-w-sm">
                {program.modules.length === 0
                  ? `Add a module to ${program.title}, then upload videos, slide decks and notes for students.`
                  : "Pick a module from the left panel to add videos, PPT files, and notes."}
              </p>
              {program.modules.length === 0 && (
                <Button
                  variant="gold"
                  size="md"
                  className="mt-5 min-h-[44px]"
                  onClick={() => setShowModuleForm(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add First Module
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Module header */}
              <Card className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant="gold">{program.title}</Badge>
                      <span className="text-[10px] text-[var(--portal-muted-2,#666)] uppercase tracking-wider">
                        Module {program.modules.findIndex((m) => m.id === selectedModule.id) + 1}
                      </span>
                    </div>
                    <h3 className="font-heading text-xl font-bold text-[var(--portal-fg,#fff)]">
                      {selectedModule.title}
                    </h3>
                    {selectedModule.description && (
                      <p className="text-[var(--portal-muted,#A8A8A8)] text-sm mt-1">
                        {selectedModule.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteModule(selectedModule.id)}
                    className="text-red-400 shrink-0 min-h-[40px]"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
              </Card>

              {/* Content type tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex gap-1 p-1 rounded-xl bg-[var(--portal-bg-elevated,#101010)] border border-[var(--portal-border,rgba(212,175,55,0.15))] overflow-x-auto">
                  {(
                    [
                      {
                        id: "videos" as const,
                        label: "Videos",
                        icon: Video,
                        count: selectedModule.videos.length,
                        color: "text-red-400",
                      },
                      {
                        id: "ppt" as const,
                        label: "Slides",
                        icon: Presentation,
                        count: selectedModule.ppts.length,
                        color: "text-orange-400",
                      },
                      {
                        id: "notes" as const,
                        label: "Notes",
                        icon: FileText,
                        count: selectedModule.notes.length,
                        color: "text-blue-400",
                      },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setContentTab(tab.id);
                        resetContentForm();
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                        contentTab === tab.id
                          ? "bg-[#D4AF37]/20 text-[#FFD700]"
                          : "text-[var(--portal-muted,#A8A8A8)] hover:text-[var(--portal-fg,#fff)]"
                      )}
                    >
                      <tab.icon className={cn("w-4 h-4", contentTab === tab.id && tab.color)} />
                      {tab.label}
                      <span className="text-[10px] opacity-70">({tab.count})</span>
                    </button>
                  ))}
                </div>
                <Button
                  variant="gold"
                  size="sm"
                  className="min-h-[40px] shrink-0"
                  onClick={() => {
                    setFormError(null);
                    setInputMode("upload");
                    clearUpload();
                    setShowContentForm(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add {contentTab === "videos" ? "Video" : contentTab === "ppt" ? "Slides" : "Note"}
                </Button>
              </div>

              {/* Add content form */}
              {showContentForm && (
                <Card className="p-4 sm:p-5 border-[#D4AF37]/30">
                  <h4 className="font-heading text-sm font-semibold text-[var(--portal-fg,#fff)] mb-4">
                    Add{" "}
                    {contentTab === "videos"
                      ? "Video"
                      : contentTab === "ppt"
                        ? "Slide Deck"
                        : "Note"}{" "}
                    to {selectedModule.title}
                  </h4>

                  <div className="space-y-3">
                    <Input
                      label="Title"
                      value={contentTitle}
                      onChange={(e) => setContentTitle(e.target.value)}
                      placeholder="Lesson title"
                    />

                    {formError && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {formError}
                      </p>
                    )}

                    {(contentTab === "videos" || contentTab === "ppt") && (
                      <div className="flex gap-1 p-1 rounded-lg bg-[var(--portal-bg-subtle,#0a0a0a)] border border-[var(--portal-border,rgba(212,175,55,0.15))] w-fit">
                        {(["upload", "url"] as const).map((mode) => {
                          const ModeIcon = mode === "upload" ? Upload : Link2;
                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => {
                                setInputMode(mode);
                                clearUpload();
                                setFormError(null);
                              }}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                                inputMode === mode
                                  ? "bg-[#D4AF37]/20 text-[#FFD700]"
                                  : "text-[var(--portal-muted,#A8A8A8)] hover:text-[var(--portal-fg,#fff)]"
                              )}
                            >
                              <ModeIcon className="w-3.5 h-3.5" />
                              {mode === "upload" ? "Upload file" : "Paste URL"}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {contentTab === "videos" && (
                      <>
                        {inputMode === "upload" ? (
                          <FileUploadField
                            category="videos"
                            hint={`MP4, WebM, MOV · max ${formatFileSize(UPLOAD_CONFIG.videos.maxBytes)}`}
                            value={uploadedFileUrl}
                            fileName={uploadedFileName}
                            onUploaded={handleUploaded}
                            onClear={clearUpload}
                          />
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label className="block text-xs text-[var(--portal-muted,#A8A8A8)] uppercase tracking-wider">
                                  Source
                                </label>
                                <select
                                  className="input-luxury w-full px-3 py-2.5 text-sm"
                                  value={videoType}
                                  onChange={(e) =>
                                    setVideoType(e.target.value as VideoType)
                                  }
                                >
                                  <option value="youtube">YouTube</option>
                                  <option value="vimeo">Vimeo</option>
                                  <option value="hls">HLS</option>
                                  <option value="mp4">MP4 URL</option>
                                </select>
                              </div>
                              <Input
                                label="Duration (min)"
                                type="number"
                                value={videoDuration}
                                onChange={(e) => setVideoDuration(e.target.value)}
                              />
                            </div>
                            <Input
                              label="Video URL"
                              value={contentUrl}
                              onChange={(e) => setContentUrl(e.target.value)}
                              placeholder="https://youtube.com/watch?v=..."
                            />
                          </>
                        )}
                        {inputMode === "upload" && (
                          <Input
                            label="Duration (min)"
                            type="number"
                            value={videoDuration}
                            onChange={(e) => setVideoDuration(e.target.value)}
                          />
                        )}
                      </>
                    )}

                    {contentTab === "ppt" &&
                      (inputMode === "upload" ? (
                        <FileUploadField
                          category="ppt"
                          hint={`PPT, PPTX, PDF · max ${formatFileSize(UPLOAD_CONFIG.ppt.maxBytes)}`}
                          value={uploadedFileUrl}
                          fileName={uploadedFileName}
                          onUploaded={handleUploaded}
                          onClear={clearUpload}
                        />
                      ) : (
                        <Input
                          label="File URL"
                          value={contentUrl}
                          onChange={(e) => setContentUrl(e.target.value)}
                          placeholder="https:// or /files/..."
                        />
                      ))}

                    {contentTab === "notes" && (
                      <>
                        <div className="space-y-2">
                          <label className="block text-xs text-[var(--portal-muted,#A8A8A8)] uppercase tracking-wider">
                            Written content
                          </label>
                          <textarea
                            className="input-luxury w-full px-4 py-3 text-sm min-h-[100px]"
                            value={contentText}
                            onChange={(e) => setContentText(e.target.value)}
                            placeholder="Type lesson notes here (optional if uploading a file)..."
                          />
                        </div>
                        <FileUploadField
                          category="notes"
                          label="Upload document (optional)"
                          hint={`PDF, DOC, TXT · max ${formatFileSize(UPLOAD_CONFIG.notes.maxBytes)}`}
                          value={uploadedFileUrl}
                          fileName={uploadedFileName}
                          onUploaded={handleUploaded}
                          onClear={clearUpload}
                        />
                      </>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button variant="gold" size="sm" onClick={addContent} className="min-h-[40px]">
                        <CheckCircle2 className="w-4 h-4" />
                        Save Content
                      </Button>
                      <Button variant="ghost" size="sm" onClick={resetContentForm}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Content list */}
              <div className="space-y-2">
                {contentTab === "videos" &&
                  (selectedModule.videos.length === 0 ? (
                    <EmptyContent type="videos" onAdd={() => setShowContentForm(true)} />
                  ) : (
                    selectedModule.videos.map((v) => (
                      <ContentRow
                        key={v.id}
                        icon={Video}
                        iconColor="text-red-400"
                        title={v.title}
                        meta={`${v.type.toUpperCase()} · ${formatDuration(v.duration_seconds)} · published`}
                        onDelete={() => deleteContent("videos", v.id)}
                      />
                    ))
                  ))}

                {contentTab === "ppt" &&
                  (selectedModule.ppts.length === 0 ? (
                    <EmptyContent type="ppt" onAdd={() => setShowContentForm(true)} />
                  ) : (
                    selectedModule.ppts.map((p) => (
                      <ContentRow
                        key={p.id}
                        icon={Presentation}
                        iconColor="text-orange-400"
                        title={p.title}
                        meta={p.file_url.split("/").pop() ?? p.file_url}
                        onDelete={() => deleteContent("ppt", p.id)}
                      />
                    ))
                  ))}

                {contentTab === "notes" &&
                  (selectedModule.notes.length === 0 ? (
                    <EmptyContent type="notes" onAdd={() => setShowContentForm(true)} />
                  ) : (
                    selectedModule.notes.map((n) => (
                      <ContentRow
                        key={n.id}
                        icon={FileText}
                        iconColor="text-blue-400"
                        title={n.title}
                        meta={
                          [
                            n.file_url ? n.file_url.split("/").pop() : null,
                            n.content
                              ? n.content.length > 60
                                ? `${n.content.slice(0, 60)}…`
                                : n.content
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Text note"
                        }
                        onDelete={() => deleteContent("notes", n.id)}
                      />
                    ))
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar — program summary + hierarchy */}
        <Card className="p-4 sm:p-5 h-fit lg:sticky lg:top-24 hidden xl:block">
          <h3 className="font-heading text-sm font-semibold text-[var(--portal-fg,#fff)] mb-3 flex items-center gap-2">
            <programMeta.icon className="w-4 h-4 text-[#D4AF37]" />
            {program.title} Summary
          </h3>
          <div className="space-y-2 mb-5">
            {[
              { label: "Modules", value: programStats.modules },
              { label: "Videos", value: programStats.videos },
              { label: "Slides", value: programStats.ppts },
              { label: "Notes", value: programStats.notes },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between text-xs p-2 rounded-lg border border-[var(--portal-border,rgba(212,175,55,0.12))]"
              >
                <span className="text-[var(--portal-muted,#A8A8A8)]">{row.label}</span>
                <span className="font-numbers text-[#FFD700]">{row.value}</span>
              </div>
            ))}
          </div>

          <h4 className="text-[10px] uppercase tracking-wider text-[var(--portal-muted-2,#666)] mb-2">
            Full Tree
          </h4>
          <div className="space-y-1 max-h-[280px] overflow-y-auto">
            {programs.map((p) => (
              <div key={p.slug}>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Set(expandedPrograms);
                    if (next.has(p.slug)) next.delete(p.slug);
                    else next.add(p.slug);
                    setExpandedPrograms(next);
                  }}
                  className="flex items-center gap-1.5 w-full text-left py-1.5 text-xs font-medium text-[#FFD700]"
                >
                  {expandedPrograms.has(p.slug) ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                  {p.title} ({p.modules.length})
                </button>
                {expandedPrograms.has(p.slug) && (
                  <div className="ml-4 space-y-1 border-l border-[var(--portal-border,rgba(212,175,55,0.15))] pl-3 pb-1">
                    {p.modules.length === 0 ? (
                      <p className="text-[10px] text-[var(--portal-muted-2,#666)] italic py-1">
                        No modules
                      </p>
                    ) : (
                      p.modules.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            switchProgram(p.slug);
                            setSelectedModuleId(m.id);
                          }}
                          className={cn(
                            "block w-full text-left text-[10px] py-1 truncate transition-colors",
                            selectedModuleId === m.id && activeProgram === p.slug
                              ? "text-[#FFD700] font-medium"
                              : "text-[var(--portal-muted,#A8A8A8)] hover:text-[var(--portal-fg,#fff)]"
                          )}
                        >
                          {m.title}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ContentRow({
  icon: Icon,
  iconColor,
  title,
  meta,
  onDelete,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  meta: string;
  onDelete: () => void;
}) {
  return (
    <div className="glass-card p-3 sm:p-4 flex items-center gap-3 group">
      <div className="w-9 h-9 rounded-lg bg-[var(--portal-bg-subtle,#0a0a0a)] border border-[var(--portal-border,rgba(212,175,55,0.1))] flex items-center justify-center shrink-0">
        <Icon className={cn("w-4 h-4", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--portal-fg,#fff)] truncate">{title}</p>
        <p className="text-[10px] text-[var(--portal-muted-2,#666)] truncate mt-0.5">{meta}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
        aria-label="Delete"
      >
        <Trash2 className="w-4 h-4 text-red-400" />
      </Button>
    </div>
  );
}

function EmptyContent({
  type,
  onAdd,
}: {
  type: ContentTab;
  onAdd: () => void;
}) {
  const config = {
    videos: { label: "videos", icon: Video, hint: "Upload MP4 or paste a YouTube link" },
    ppt: { label: "slide decks", icon: Presentation, hint: "Upload PPT, PPTX or PDF" },
    notes: { label: "notes", icon: FileText, hint: "Write text or upload a document" },
  }[type];
  const Icon = config.icon;

  return (
    <div className="glass-card p-8 text-center border-dashed">
      <Icon className="w-8 h-8 text-[#D4AF37]/40 mx-auto mb-2" />
      <p className="text-[var(--portal-fg,#fff)] text-sm font-medium">
        No {config.label} yet
      </p>
      <p className="text-[var(--portal-muted-2,#666)] text-xs mt-1 mb-4">{config.hint}</p>
      <Button variant="outline" size="sm" onClick={onAdd}>
        <Plus className="w-4 h-4" />
        Add first {type === "ppt" ? "slides" : type === "videos" ? "video" : "note"}
      </Button>
    </div>
  );
}
