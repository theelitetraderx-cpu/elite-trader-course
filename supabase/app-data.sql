-- App-specific tables for The Elite Trader LMS
-- Run after supabase/schema.sql

CREATE TABLE IF NOT EXISTS app_course_programs (
  id TEXT PRIMARY KEY DEFAULT 'programs',
  programs JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_course_access (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS app_module_progress (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  watch_time_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_app_course_access_user ON app_course_access(user_id);
CREATE INDEX IF NOT EXISTS idx_app_module_progress_user ON app_module_progress(user_id);

-- Durable JSON bags for meetings, payments, and other admin data on serverless
CREATE TABLE IF NOT EXISTS app_json_documents (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage bucket for course videos / PPT / PDF (also creatable in Dashboard → Storage)
-- Run in SQL editor if bucket API create is blocked:
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('course-content', 'course-content', false, 524288000)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 524288000;
