"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/lib/utils";
import {
  Users,
  BookOpen,
  Video,
  Download,
  HardDrive,
  Activity,
  TrendingUp,
  Presentation,
  FileText,
  Layers,
  Loader2,
} from "lucide-react";
import { usePlatformAnalytics } from "@/components/admin/use-platform-analytics";

export default function AdminDashboard() {
  const { analytics, loading, error } = usePlatformAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#A8A8A8]">
        <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37] mr-2" />
        Loading dashboard...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="glass-card p-10 text-center text-[#A8A8A8]">
        {error ?? "Unable to load analytics."}
      </div>
    );
  }

  const stats = [
    {
      label: "Total Students",
      value: analytics.totalStudents.toLocaleString(),
      icon: Users,
    },
    {
      label: "Active Students",
      value: analytics.activeStudents.toLocaleString(),
      icon: Activity,
    },
    {
      label: "Published Videos",
      value: analytics.totalVideos.toString(),
      icon: Video,
    },
    {
      label: "Slides & Notes",
      value: (analytics.totalSlides + analytics.totalNotes).toString(),
      icon: Download,
    },
    {
      label: "Modules",
      value: analytics.totalModules.toString(),
      icon: Layers,
    },
    {
      label: "Storage Used",
      value: formatBytes(analytics.storageUsed),
      icon: HardDrive,
    },
    {
      label: "Today's Logins",
      value: analytics.todayLogins.toString(),
      icon: TrendingUp,
    },
    {
      label: "Programs",
      value: analytics.totalCourses.toString(),
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[#D4AF37] text-sm uppercase tracking-widest mb-2">
          Admin Panel
        </p>
        <h1 className="font-heading text-3xl font-bold text-white">
          Dashboard Overview
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-[#D4AF37]" />
              </div>
            </div>
            <p className="font-numbers text-2xl font-bold text-[#FFD700]">{stat.value}</p>
            <p className="text-[#A8A8A8] text-xs uppercase tracking-wider mt-1">
              {stat.label}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="mb-6">Content Breakdown</CardTitle>
          <div className="space-y-3">
            {[
              { label: "Videos", value: analytics.totalVideos, icon: Video },
              { label: "Slides", value: analytics.totalSlides, icon: Presentation },
              { label: "Notes", value: analytics.totalNotes, icon: FileText },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 rounded-lg bg-[#101010] border border-[rgba(212,175,55,0.1)]"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-white text-sm">{item.label}</span>
                </div>
                <span className="font-numbers text-[#FFD700]">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-6">Enrollment by Program</CardTitle>
          <div className="space-y-3">
            {analytics.enrollmentByCourse.map((course) => (
              <div
                key={course.courseId}
                className="flex items-center justify-between p-3 rounded-lg bg-[#101010] border border-[rgba(212,175,55,0.1)]"
              >
                <span className="text-white text-sm">{course.title}</span>
                <span className="font-numbers text-[#FFD700]">
                  {course.students} student{course.students !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle className="mb-6">Recent Activity</CardTitle>
        <p className="text-[#A8A8A8] text-sm py-4">
          {analytics.todayLogins > 0
            ? `${analytics.todayLogins} login${analytics.todayLogins !== 1 ? "s" : ""} today · ${analytics.suspendedStudents} suspended student${analytics.suspendedStudents !== 1 ? "s" : ""}`
            : "No logins recorded today. Activity will appear here as students use the platform."}
        </p>
      </Card>
    </div>
  );
}
