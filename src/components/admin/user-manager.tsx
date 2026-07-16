"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO_COURSES } from "@/lib/data/demo-data";
import { getInitials, cn } from "@/lib/utils";
import type { AdminUserView } from "@/lib/data/user-store";
import type { UserRole, UserStatus } from "@/types";
import { canManageStaffRoles, isSuperAdmin, roleLabel } from "@/lib/admin/roles";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Key,
  X,
  Loader2,
  CheckCircle2,
  Users,
  GraduationCap,
  Shield,
  UserPlus,
} from "lucide-react";

type ModalMode = "create" | "edit" | "password" | null;
type FilterTab = "all" | "students" | "staff";

interface UserFormState {
  username: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  expiry_date: string;
  course_ids: string[];
}

const emptyForm = (): UserFormState => ({
  username: "",
  password: "",
  confirmPassword: "",
  full_name: "",
  email: "",
  phone: "",
  role: "student",
  status: "active",
  expiry_date: "",
  course_ids: [],
});

function userToForm(user: AdminUserView): UserFormState {
  return {
    username: user.username,
    password: "",
    confirmPassword: "",
    full_name: user.full_name,
    email: user.email,
    phone: user.phone ?? "",
    role: user.role,
    status: user.status,
    expiry_date: user.expiry_date?.slice(0, 10) ?? "",
    course_ids: [...user.course_ids],
  };
}

function courseLabel(id: string) {
  return DEMO_COURSES.find((c) => c.id === id)?.title ?? id;
}

function isStaffRole(role: UserRole) {
  return role === "super_admin" || role === "admin" || role === "moderator";
}

function roleBadgeVariant(role: UserRole) {
  if (role === "super_admin") return "gold";
  if (role === "admin") return "gold";
  if (role === "moderator") return "default";
  return "default";
}

function statusBadgeVariant(status: UserStatus) {
  if (status === "active") return "success";
  if (status === "suspended") return "danger";
  return "default";
}

function formatLastLogin(iso?: string) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function UserManager() {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [modal, setModal] = useState<ModalMode>(null);
  const [activeUser, setActiveUser] = useState<AdminUserView | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserView | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("admin");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load users");
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.role) setCurrentRole(data.user.role);
      })
      .catch(() => undefined);
  }, [loadUsers]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  const canAssignStaff = canManageStaffRoles(currentRole);

  const stats = useMemo(
    () => ({
      total: users.length,
      students: users.filter((u) => u.role === "student").length,
      active: users.filter((u) => u.status === "active").length,
      suspended: users.filter((u) => u.status === "suspended").length,
    }),
    [users]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === "students" && u.role !== "student") return false;
      if (filter === "staff" && !isStaffRole(u.role)) return false;
      if (!query) return true;
      return (
        u.full_name.toLowerCase().includes(query) ||
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.phone?.toLowerCase().includes(query)
      );
    });
  }, [users, search, filter]);

  const openCreate = () => {
    setForm(emptyForm());
    setActiveUser(null);
    setModal("create");
    setError(null);
  };

  const openEdit = (user: AdminUserView) => {
    setForm(userToForm(user));
    setActiveUser(user);
    setModal("edit");
    setError(null);
  };

  const openPassword = (user: AdminUserView) => {
    setForm({ ...emptyForm(), username: user.username });
    setActiveUser(user);
    setModal("password");
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setActiveUser(null);
    setForm(emptyForm());
    setError(null);
  };

  const toggleCourse = (courseId: string) => {
    setForm((prev) => ({
      ...prev,
      course_ids: prev.course_ids.includes(courseId)
        ? prev.course_ids.filter((id) => id !== courseId)
        : [...prev.course_ids, courseId],
    }));
  };

  const handleCreate = async () => {
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || undefined,
          role: "student",
          status: form.status,
          expiry_date: form.expiry_date || undefined,
          course_ids: form.course_ids,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create user");
      setUsers((prev) => [data.user, ...prev]);
      closeModal();
      setSuccess(`Student "${data.user.full_name}" created successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!activeUser) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${activeUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          status: form.status,
          expiry_date: form.expiry_date || null,
          course_ids: form.course_ids,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update user");
      setUsers((prev) => prev.map((u) => (u.id === activeUser.id ? data.user : u)));
      closeModal();
      setSuccess(`"${data.user.full_name}" updated successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async () => {
    if (!activeUser) return;
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${activeUser.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update password");
      closeModal();
      setSuccess(`Password updated for ${activeUser.full_name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user: AdminUserView) => {
    const nextStatus: UserStatus = user.status === "active" ? "suspended" : "active";
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update status");
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
      );
      setSuccess(
        `${user.full_name} ${nextStatus === "active" ? "activated" : "suspended"}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete user");
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      setSuccess(`"${deleteTarget.full_name}" deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setSaving(false);
    }
  };

  const renderCourseAccess = () => (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-[var(--portal-muted,#A8A8A8)] font-medium">
        Course Access
      </p>
      <div className="flex flex-wrap gap-2">
        {DEMO_COURSES.map((course) => {
          const selected = form.course_ids.includes(course.id);
          return (
            <button
              key={course.id}
              type="button"
              onClick={() => toggleCourse(course.id)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-medium border transition-colors",
                selected
                  ? "bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#FFD700]"
                  : "border-[var(--portal-border,rgba(212,175,55,0.2))] text-[var(--portal-muted,#A8A8A8)] hover:border-[#D4AF37]/40"
              )}
            >
              {course.title}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--portal-fg,#fff)] flex items-center gap-2">
            <Users className="w-7 h-7 text-[#D4AF37]" />
            User Management
          </h1>
          <p className="text-[var(--portal-muted,#A8A8A8)] text-sm mt-1">
            Manage students — add accounts, assign courses, reset passwords
          </p>
        </div>
        <Button variant="gold" size="md" onClick={openCreate} className="min-h-[44px] shrink-0">
          <UserPlus className="w-4 h-4" /> Add Student
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: stats.total, icon: Users, color: "text-[var(--portal-fg,#fff)]" },
          { label: "Students", value: stats.students, icon: GraduationCap, color: "text-[#FFD700]" },
          { label: "Active", value: stats.active, icon: UserCheck, color: "text-green-400" },
          { label: "Suspended", value: stats.suspended, icon: UserX, color: "text-red-400" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card p-3 sm:p-4 text-center">
              <Icon className="w-4 h-4 text-[#D4AF37] mx-auto mb-2" />
              <p className={cn("font-numbers text-xl sm:text-2xl font-bold", stat.color)}>
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--portal-muted-2,#666)] mt-0.5">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {success && (
        <div className="glass-card p-4 border-green-500/30 bg-green-500/5 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <p className="text-green-400 text-sm flex-1">{success}</p>
          <button type="button" onClick={() => setSuccess(null)} aria-label="Dismiss">
            <X className="w-4 h-4 text-green-400/70" />
          </button>
        </div>
      )}

      {error && !modal && !deleteTarget && (
        <div className="glass-card p-4 border-red-500/30 bg-red-500/5 flex items-start gap-3">
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            <X className="w-4 h-4 text-red-400/70" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">
        <div className="space-y-4">
          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--portal-muted-2,#666)]" />
              <input
                className="input-luxury w-full pl-10 pr-4 py-2.5 text-sm"
                placeholder="Search name, username, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 p-1 rounded-xl bg-[var(--portal-bg-elevated,#101010)] border border-[var(--portal-border,rgba(212,175,55,0.15))]">
              {(
                [
                  { id: "all" as const, label: "All" },
                  { id: "students" as const, label: "Students" },
                  { id: "staff" as const, label: "Staff" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                    filter === tab.id
                      ? "bg-[#D4AF37]/20 text-[#FFD700]"
                      : "text-[var(--portal-muted,#A8A8A8)] hover:text-[var(--portal-fg,#fff)]"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* User cards */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[var(--portal-muted,#A8A8A8)] gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
              Loading users...
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <Users className="w-10 h-10 text-[#D4AF37]/40 mx-auto mb-3" />
              <p className="text-[var(--portal-fg,#fff)] text-sm font-medium">No users found</p>
              <p className="text-[var(--portal-muted-2,#666)] text-xs mt-1">
                {filter === "students"
                  ? "Add your first student with the button above"
                  : "Try a different search or filter"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((user) => (
                <Card key={user.id} className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center text-[#050505] font-bold text-sm shrink-0">
                        {getInitials(user.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-heading font-bold text-[var(--portal-fg,#fff)]">
                            {user.full_name}
                          </h3>
                          <Badge variant={roleBadgeVariant(user.role)}>
                            {roleLabel(user.role)}
                          </Badge>
                          <Badge variant={statusBadgeVariant(user.status)}>
                            {user.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-[var(--portal-muted,#A8A8A8)]">
                          @{user.username} · {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-xs text-[var(--portal-muted-2,#666)] mt-0.5">
                            {user.phone}
                          </p>
                        )}
                        {user.role === "student" && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {user.course_ids.length ? (
                              user.course_ids.map((id) => (
                                <span
                                  key={id}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#FFD700] border border-[#D4AF37]/20"
                                >
                                  {courseLabel(id)}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-[var(--portal-muted-2,#666)] italic">
                                No courses assigned
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-[10px] text-[var(--portal-muted-2,#666)] mt-2">
                          Last login: {formatLastLogin(user.last_login)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openPassword(user)}>
                        <Key className="w-3.5 h-3.5" /> Password
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(user)}
                        className={user.status === "active" ? "text-yellow-500" : "text-green-400"}
                      >
                        {user.status === "active" ? (
                          <>
                            <UserX className="w-3.5 h-3.5" /> Suspend
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" /> Activate
                          </>
                        )}
                      </Button>
                      {!isStaffRole(user.role) || isSuperAdmin(currentRole) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(user)}
                          className="text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar tips */}
        <Card className="p-4 sm:p-5 h-fit lg:sticky lg:top-24">
          <h3 className="font-heading text-sm font-semibold text-[var(--portal-fg,#fff)] mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#D4AF37]" />
            Quick Guide
          </h3>
          <div className="space-y-2 text-xs text-[var(--portal-muted,#A8A8A8)]">
            {[
              "Add students here with course access",
              "Use Password to reset login credentials",
              "Suspend accounts instead of deleting when unsure",
            ].map((tip) => (
              <div
                key={tip}
                className="flex gap-2 p-2.5 rounded-lg border border-[var(--portal-border,rgba(212,175,55,0.12))]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                {tip}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Create / Edit modal */}
      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <CardTitle>
                {modal === "create" ? "Add New Student" : `Edit ${activeUser?.full_name}`}
              </CardTitle>
              <button type="button" onClick={closeModal} className="p-2 text-[var(--portal-muted,#A8A8A8)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <Input
                label="Full Name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="John Trader"
              />
              <Input
                label="Username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="john_trader"
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="john@example.com"
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
              {modal === "create" && (
                <>
                  <Input
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                    }
                  />
                </>
              )}
              <Input
                label="Expiry Date (optional)"
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--portal-muted,#A8A8A8)] uppercase tracking-wider">
                  Status
                </label>
                <select
                  className="input-luxury w-full px-4 py-3 text-sm"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as UserStatus }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {(modal === "create" || form.role === "student") && (
              <div className="mb-5">{renderCourseAccess()}</div>
            )}

            <div className="flex gap-3">
              <Button
                variant="gold"
                size="md"
                disabled={saving}
                className="min-h-[44px]"
                onClick={modal === "create" ? handleCreate : handleUpdate}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : modal === "create" ? (
                  <>
                    <Plus className="w-4 h-4" /> Create Student
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button variant="ghost" size="md" onClick={closeModal}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Password modal */}
      {modal === "password" && activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <Card className="w-full max-w-md p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Reset Password</CardTitle>
              <button type="button" onClick={closeModal} className="p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[var(--portal-muted,#A8A8A8)] text-sm mb-4">
              Set a new password for{" "}
              <span className="text-[var(--portal-fg,#fff)] font-medium">
                {activeUser.full_name}
              </span>{" "}
              (@{activeUser.username})
            </p>
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}
            <div className="space-y-4 mb-5">
              <Input
                label="New Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <Input
                label="Confirm Password"
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-3">
              <Button variant="gold" size="md" disabled={saving} onClick={handlePassword}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
              </Button>
              <Button variant="ghost" size="md" onClick={closeModal}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <Card className="w-full max-w-md p-4 sm:p-6">
            <CardTitle className="mb-3">Delete User</CardTitle>
            <p className="text-[var(--portal-muted,#A8A8A8)] text-sm mb-5">
              Permanently delete{" "}
              <span className="text-[var(--portal-fg,#fff)]">{deleteTarget.full_name}</span>?
              This cannot be undone.
            </p>
            {error && (
              <div className="text-red-400 text-sm mb-4">{error}</div>
            )}
            <div className="flex gap-3">
              <Button
                variant="gold"
                size="md"
                disabled={saving}
                onClick={confirmDelete}
                className="!bg-red-600 hover:!bg-red-700 min-h-[44px]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setDeleteTarget(null);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
