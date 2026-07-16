"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2, X, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatFileSize,
  getAcceptString,
  type UploadCategory,
} from "@/lib/upload/config";

interface FileUploadFieldProps {
  category: UploadCategory;
  label?: string;
  hint?: string;
  value?: string | null;
  fileName?: string | null;
  onUploaded: (url: string, fileName: string) => void;
  onClear?: () => void;
  className?: string;
}

export function FileUploadField({
  category,
  label = "Upload file",
  hint,
  value,
  fileName,
  onUploaded,
  onClear,
  className,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      onUploaded(data.url, data.fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) upload(file);
  };

  const hasFile = Boolean(value && fileName);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-[#A8A8A8] uppercase tracking-wider">
          {label}
        </label>
      )}

      {hasFile ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#101010] border border-[rgba(212,175,55,0.25)]">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm truncate">{fileName}</p>
            <p className="text-[#A8A8A8] text-xs truncate">{value}</p>
          </div>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 text-[#A8A8A8] hover:text-white shrink-0"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
            dragOver
              ? "border-[#D4AF37] bg-[#D4AF37]/10"
              : "border-[rgba(212,175,55,0.25)] hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5",
            uploading && "pointer-events-none opacity-70"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={getAcceptString(category)}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-[#A8A8A8]">
              <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
              <p className="text-sm">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-[#D4AF37]" />
              <p className="text-white text-sm font-medium">
                Click or drag file to upload
              </p>
              {hint && <p className="text-[#A8A8A8] text-xs">{hint}</p>}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <FileIcon className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

export { formatFileSize };
