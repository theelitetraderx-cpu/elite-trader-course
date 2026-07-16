"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminUserView } from "@/lib/data/user-store";
import type { StaffPermissions, UserRole, UserStatus } from "@/types";
import { cn, getInitials } from "@/lib/utils";
import {
  DEFAULT_MODERATOR_PERMISSIONS,
  FULL_STAFF_PERMISSIONS,
  PERMISSION_LABELS,
  defaultPermissionsForRole,
} from "@/lib/admin/permissions";
import { isSuperAdmin, roleLabel } from "@/lib/admin/roles";
import {
  CheckCircle2,
  Crown,
  Loader2,
  Shield,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";

type SectionTab = "all" | "admin" | "moderator";

const emptyForm = () => ({
  username: "",
  password: "",
  full_name: "",
  email: "",
  phone: "",
  role: "moderator" as "admin" | "moderator",
  status: "active" as UserStatus,
});

function PermissionEditor({
  permissions,
  onChange,
  readOnlyKeys = [] as (keyof StaffPermissions)[],
}: {
  permissions: StaffPermissions;
  onChange: (next: StaffPermissions) => void;
  readOnlyKeys?: (keyof StaffPermissions)[];
}) {
  return (
    <div className="space-y-2">
      {PERMISSION_LABELS.map((item) => {
        if (item.limitOnly) {
          return (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--portal-border,rgba(212,175,55,0.15))]"
            >
              <div>
                <p className="text-sm font-medium text-[var(--portal-fg,#fff)]">
                  {item.label}
                </p>
                <p className="text-[11px] text-[var(--portal-muted-2,#666)]">{item.hint}</p>
              </div>
              <input
                type="number"
                min={0}
                className="input-luxury w-24 px-3 py-2 text-sm text-right"
                value={permissions.max_students ?? ""}
                placeholder="∞"
                onChange={(e) =>
                  onChange({
                    ...permissions,
                    max_students: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>
          );
        }

        const checked = Boolean(permissions[item.key as keyof Omit<StaffPermissions, "max_students">]);
        const disabled = readOnlyKeys.includes(item.key);

        return (
          <label
            key={item.key}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
              checked
                ? "border-[#D4AF37]/40 bg-[#D4AF37]/8"
                : "border-[var(--portal-border,rgba(212,175,55,0.15))]",
              disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...permissions,
                  [item.key]: e.target.checked,
                } as StaffPermissions)
              }
              className="w-4 h-4 mt-0.5 accent-[#D4AF37]"
            />
            <div>
              <p className="text-sm font-medium text-[var(--portal-fg,#fff)]">{item.label}</p>
              <p className="text-[11px] text-[var(--portal-muted-2,#666)]">{item.hint}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}

export function StaffManager() {
  const [staff, setStaff] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("admin");
  const [canCreateAdmin, setCanCreateAdmin] = useState(false);
  const [section, setSection] = useState<SectionTab>("all");
  const [form, setForm] = useState(emptyForm);
  const [formPermissions, setFormPermissions] = useState<StaffPermissions>({
    ...DEFAULT_MODERATOR_PERMISSIONS,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPermissions, setEditPermissions] = useState<StaffPermissions>({
    ...DEFAULT_MODERATOR_PERMISSIONS,
  });

  const isSuper = canCreateAdmin || isSuperAdmin(currentRole);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load staff");
      setStaff(data.staff ?? []);
      if (data.actorRole) setCurrentRole(data.actorRole);
      if (typeof data.canCreateAdmin === "boolean") {
        setCanCreateAdmin(data.canCreateAdmin);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.role) setCurrentRole(data.user.role);
        if (isSuperAdmin(data.user?.role)) setCanCreateAdmin(true);
      })
      .catch(() => undefined);
  }, [loadStaff]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    setFormPermissions(
      form.role === "admin"
        ? { ...FULL_STAFF_PERMISSIONS }
        : { ...DEFAULT_MODERATOR_PERMISSIONS }
    );
  }, [form.role]);

  const filteredStaff = useMemo(() => {
    if (section === "all") return staff;
    return staff.filter((m) => m.role === section);
  }, [staff, section]);

  const stats = useMemo(
    () => ({
      admins: staff.filter((m) => m.role === "admin").length,
      moderators: staff.filter((m) => m.role === "moderator").length,
      active: staff.filter((m) => m.status === "active").length,
    }),
    [staff]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          staff_permissions: formPermissions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create staff member");

      setForm(emptyForm());
      setFormPermissions({ ...DEFAULT_MODERATOR_PERMISSIONS });
      await loadStaff();
      setSuccess(
        `${roleLabel(data.user.role)} "${data.user.full_name}" created successfully.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create staff member");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (member: AdminUserView) => {
    setEditingId(member.id);
    setEditPermissions(
      member.staff_permissions ??
        defaultPermissionsForRole(member.role as "admin" | "moderator") ??
        DEFAULT_MODERATOR_PERMISSIONS
    );
  };

  const saveLimits = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_permissions: editPermissions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save limits");

      setStaff((prev) => prev.map((m) => (m.id === id ? data.user : m)));
      setEditingId(null);
      setSuccess("Access limits updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save limits");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (member: AdminUserView) => {
    const next: UserStatus = member.status === "active" ? "suspended" : "active";
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/staff?id=${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update status");
      setStaff((prev) => prev.map((m) => (m.id === member.id ? data.user : m)));
      setSuccess(`Account ${next === "active" ? "activated" : "suspended"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  if (!isSuper && currentRole !== "admin") {
    return (
      <div className="glass-card p-10 text-center text-[var(--portal-muted,#A8A8A8)]">
        Staff management is available to super admins and admins only.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--portal-fg,#fff)] flex items-center gap-2">
          <Shield className="w-7 h-7 text-[#D4AF37]" />
          Staff & Access Limits
        </h1>
        <p className="text-[var(--portal-muted,#A8A8A8)] text-sm mt-1">
          {isSuper
            ? "Create admins and moderators — set what each role can access"
            : "Create moderators and set their access limits"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Admins", value: stats.admins, icon: Crown },
          { label: "Moderators", value: stats.moderators, icon: UserCog },
          { label: "Active", value: stats.active, icon: ShieldCheck },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card p-3 sm:p-4 text-center">
              <Icon className="w-4 h-4 text-[#D4AF37] mx-auto mb-2" />
              <p className="font-numbers text-xl font-bold text-[#FFD700]">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--portal-muted-2,#666)]">
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
          <button type="button" onClick={() => setSuccess(null)}>
            <X className="w-4 h-4 text-green-400/70" />
          </button>
        </div>
      )}

      {error && (
        <div className="glass-card p-4 border-red-500/30 bg-red-500/5 flex items-start gap-3">
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button type="button" onClick={() => setError(null)}>
            <X className="w-4 h-4 text-red-400/70" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        <Card className="p-4 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-[var(--portal-fg,#fff)] mb-1">
            Create Staff Account
          </h2>
          <p className="text-xs text-[var(--portal-muted-2,#666)] mb-5">
            {isSuper
              ? "Super admin can create both Admin and Moderator accounts"
              : "Admins can create Moderator accounts with custom limits"}
          </p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, role: "moderator" }))}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  form.role === "moderator"
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-[var(--portal-border,rgba(212,175,55,0.2))]"
                )}
              >
                <p className="text-sm font-semibold text-[var(--portal-fg,#fff)]">Moderator</p>
                <p className="text-[11px] text-[var(--portal-muted-2,#666)]">
                  Limited access — you set the limits
                </p>
              </button>
              <button
                type="button"
                disabled={!isSuper}
                onClick={() => isSuper && setForm((f) => ({ ...f, role: "admin" }))}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  form.role === "admin"
                    ? "border-[#D4AF37]/50 bg-[#D4AF37]/10"
                    : "border-[var(--portal-border,rgba(212,175,55,0.2))]",
                  !isSuper && "opacity-50 cursor-not-allowed"
                )}
              >
                <p className="text-sm font-semibold text-[var(--portal-fg,#fff)]">Admin</p>
                <p className="text-[11px] text-[var(--portal-muted-2,#666)]">
                  {isSuper
                    ? "Full panel — super admin only"
                    : "Super admin required to create admins"}
                </p>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                required
              />
              <Input
                label="Username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                required
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <Input
                label="Phone (optional)"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                className="sm:col-span-2"
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--portal-muted,#A8A8A8)] mb-2">
                Access limits
              </p>
              <PermissionEditor
                permissions={formPermissions}
                onChange={setFormPermissions}
                readOnlyKeys={!isSuper ? (["manage_staff"] as const) : []}
              />
            </div>

            <Button
              type="submit"
              variant="gold"
              size="md"
              disabled={saving}
              className="min-h-[44px]"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Create {form.role === "admin" ? "Admin" : "Moderator"}
            </Button>
          </form>
        </Card>

        <Card className="p-4 sm:p-5 h-fit lg:sticky lg:top-24">
          <h3 className="font-heading text-sm font-semibold text-[var(--portal-fg,#fff)] mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#D4AF37]" />
            Role Guide
          </h3>
          <div className="space-y-3 text-xs text-[var(--portal-muted,#A8A8A8)]">
            <div className="p-3 rounded-xl border border-[var(--portal-border,rgba(212,175,55,0.12))]">
              <p className="font-semibold text-[#FFD700] mb-1">Super Admin</p>
              Full control — creates admins & moderators, sets all limits.
            </div>
            <div className="p-3 rounded-xl border border-[var(--portal-border,rgba(212,175,55,0.12))]">
              <p className="font-semibold text-[var(--portal-fg,#fff)] mb-1">Admin</p>
              Manages moderators and sets their permissions. Cannot create other admins.
            </div>
            <div className="p-3 rounded-xl border border-[var(--portal-border,rgba(212,175,55,0.12))]">
              <p className="font-semibold text-[var(--portal-fg,#fff)] mb-1">Moderator</p>
              Limited portal access based on toggles you set (signals, meetings, etc.).
            </div>
          </div>
        </Card>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="font-heading text-lg font-semibold text-[var(--portal-fg,#fff)]">
            Team Members
          </h2>
          {isSuper && (
            <div className="flex gap-1 p-1 rounded-xl bg-[var(--portal-bg-elevated,#101010)] border border-[var(--portal-border,rgba(212,175,55,0.15))]">
              {(["all", "admin", "moderator"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSection(tab)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                    section === tab
                      ? "bg-[#D4AF37]/20 text-[#FFD700]"
                      : "text-[var(--portal-muted,#A8A8A8)]"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[var(--portal-muted,#A8A8A8)]">
            <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37] mr-2" />
            Loading staff...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <Shield className="w-10 h-10 text-[#D4AF37]/40 mx-auto mb-3" />
            <p className="text-[var(--portal-fg,#fff)] text-sm font-medium">No staff yet</p>
            <p className="text-[var(--portal-muted-2,#666)] text-xs mt-1">
              Create your first {isSuper ? "admin or moderator" : "moderator"} above
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStaff.map((member) => {
              const perms =
                member.staff_permissions ??
                defaultPermissionsForRole(member.role as "admin" | "moderator");
              const isEditing = editingId === member.id;

              return (
                <Card key={member.id} className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center text-[#050505] font-bold text-sm shrink-0">
                          {getInitials(member.full_name)}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-heading font-bold text-[var(--portal-fg,#fff)]">
                              {member.full_name}
                            </h3>
                            <Badge variant={member.role === "admin" ? "gold" : "default"}>
                              {roleLabel(member.role)}
                            </Badge>
                            <Badge
                              variant={member.status === "active" ? "success" : "danger"}
                            >
                              {member.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-[var(--portal-muted,#A8A8A8)]">
                            @{member.username} · {member.email}
                          </p>
                          {perms && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {PERMISSION_LABELS.filter((p) => !p.limitOnly).map((p) => {
                                const on = Boolean(
                                  perms[p.key as keyof Omit<StaffPermissions, "max_students">]
                                );
                                if (!on) return null;
                                return (
                                  <span
                                    key={p.key}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#FFD700] border border-[#D4AF37]/20"
                                  >
                                    {p.label}
                                  </span>
                                );
                              })}
                              {perms.max_students != null && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--portal-bg-subtle,#0a0a0a)] text-[var(--portal-muted,#A8A8A8)]">
                                  Max {perms.max_students} students
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {!isEditing && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(member)}
                              className="min-h-[40px]"
                            >
                              Set Limits
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStatus(member)}
                              disabled={saving}
                            >
                              {member.status === "active" ? "Suspend" : "Activate"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <div className="border-t border-[var(--portal-border,rgba(212,175,55,0.15))] pt-4">
                        <p className="text-xs uppercase tracking-wider text-[#FFD700] mb-3">
                          Edit access for {member.full_name}
                        </p>
                        <PermissionEditor
                          permissions={editPermissions}
                          onChange={setEditPermissions}
                          readOnlyKeys={
                            !isSuper || member.role === "moderator"
                              ? (["manage_staff"] as const)
                              : []
                          }
                        />
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="gold"
                            size="sm"
                            disabled={saving}
                            onClick={() => saveLimits(member.id)}
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Save Limits
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
