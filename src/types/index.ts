export type UserRole = "super_admin" | "admin" | "moderator" | "student";
export type SignalDirection = "buy" | "sell" | "watch";
export type SignalStatus = "active" | "closed" | "cancelled";
export type MeetingStatus = "scheduled" | "live" | "completed" | "cancelled";
export type MeetingAudience = "all" | "pro_elite";
export type NotificationType = "general" | "signal" | "meeting" | "announcement";
export type AnnouncementPriority = "normal" | "important";
export type PaymentStatus = "completed" | "pending" | "refunded" | "failed";
export type PaymentMethod =
  | "upi"
  | "bank_transfer"
  | "paypal"
  | "crypto"
  | "stripe"
  | "cash"
  | "other";
export type PaymentPlanType = "course" | "signal";
export type UserStatus = "active" | "suspended" | "inactive";
export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";
export type CourseStatus = "draft" | "published" | "archived";
export type VideoType = "mp4" | "youtube" | "vimeo" | "hls";
export type VideoStatus = "draft" | "published";
export type ContentStatus = "draft" | "published";

export interface SessionUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  staff_permissions?: StaffPermissions;
}

export interface StaffPermissions {
  manage_users: boolean;
  manage_signals: boolean;
  manage_meetings: boolean;
  manage_courses: boolean;
  manage_announcements: boolean;
  view_payments: boolean;
  view_analytics: boolean;
  manage_staff: boolean;
  /** Max students this staff member can create; null = unlimited */
  max_students: number | null;
}

export interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  expiry_date?: string;
  staff_permissions?: StaffPermissions;
  managed_by?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url?: string;
  banner_url?: string;
  price: number;
  instructor: string;
  duration_minutes: number;
  difficulty: Difficulty;
  category: string;
  status: CourseStatus;
  rating: number;
  student_count: number;
  lesson_count: number;
  module_count: number;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  lesson_count: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  duration_minutes: number;
  video_id?: string;
  has_notes: boolean;
  has_ppt: boolean;
  has_assignment: boolean;
  has_quiz: boolean;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  type: VideoType;
  url: string;
  thumbnail_url?: string;
  duration_seconds: number;
  lesson_id?: string;
  course_id?: string;
  module_id?: string;
  status: VideoStatus;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content?: string;
  file_url?: string;
  lesson_id?: string;
  course_id?: string;
  is_downloadable: boolean;
  created_at: string;
}

export interface PPTFile {
  id: string;
  title: string;
  file_url: string;
  lesson_id?: string;
  course_id?: string;
  is_downloadable: boolean;
  created_at: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  lesson_id?: string;
  course_id: string;
  deadline?: string;
  max_score: number;
  created_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  completed: boolean;
  watch_time_seconds: number;
  last_position_seconds: number;
  completed_at?: string;
  updated_at: string;
}

export interface CourseAccess {
  id: string;
  user_id: string;
  course_id: string;
  granted_at: string;
  expires_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  reference_id?: string;
  read: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  created_by: string;
  created_by_name: string;
  notified_count: number;
  created_at: string;
}

export interface TradingSignal {
  id: string;
  pair: string;
  direction: SignalDirection;
  entry?: string;
  target?: string;
  stop_loss?: string;
  notes?: string;
  status: SignalStatus;
  created_by: string;
  created_by_name: string;
  created_at: string;
  closed_at?: string;
}

export interface FavouriteCoin {
  id: string;
  pair: string;
  label?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface LiveMeeting {
  id: string;
  title: string;
  description?: string;
  meeting_url: string;
  scheduled_at: string;
  duration_minutes: number;
  status: MeetingStatus;
  audience: MeetingAudience;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  plan_name: string;
  plan_type: PaymentPlanType;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  reference?: string;
  notes?: string;
  recorded_by: string;
  recorded_by_name: string;
  paid_at: string;
  created_at: string;
}

export interface WebsiteContent {
  id: string;
  section: string;
  key: string;
  value: string | Record<string, unknown>;
  updated_at: string;
}

export interface AnalyticsOverview {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  totalVideos: number;
  totalDownloads: number;
  storageUsed: number;
  revenue: number;
  todayLogins: number;
  avgWatchTime: number;
  completionRate: number;
}
