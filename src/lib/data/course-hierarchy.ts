import type { VideoType, VideoStatus } from "@/types";

export interface ModuleVideo {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  type: VideoType;
  url: string;
  duration_seconds: number;
  status: VideoStatus;
  created_at: string;
}

export interface ModulePPT {
  id: string;
  module_id: string;
  title: string;
  file_url: string;
  is_downloadable: boolean;
  created_at: string;
}

export interface ModuleNote {
  id: string;
  module_id: string;
  title: string;
  content: string;
  file_url?: string;
  is_downloadable: boolean;
  created_at: string;
}

export interface AdminModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  videos: ModuleVideo[];
  ppts: ModulePPT[];
  notes: ModuleNote[];
  created_at: string;
}

export interface CourseProgram {
  id: string;
  slug: "foundation" | "pro" | "elite";
  title: string;
  description: string;
  price: number;
  member_price: number;
  modules: AdminModule[];
}

export type ProgramSlug = CourseProgram["slug"];

export const PROGRAM_SLUGS: ProgramSlug[] = ["foundation", "pro", "elite"];

export function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getInitialPrograms(): CourseProgram[] {
  return [
    {
      id: "course-foundation",
      slug: "foundation",
      title: "Foundation",
      description:
        "Crypto basics, Binance setup, spot trading, and core discipline skills.",
      price: 99,
      member_price: 49,
      modules: [],
    },
    {
      id: "course-pro",
      slug: "pro",
      title: "PRO",
      description:
        "Futures trading, advanced analysis, strategy sessions, and live signals.",
      price: 349,
      member_price: 249,
      modules: [],
    },
    {
      id: "course-elite",
      slug: "elite",
      title: "ELITE",
      description:
        "Elite entry models, A+ setups, private community, and priority support.",
      price: 599,
      member_price: 499,
      modules: [],
    },
  ];
}
