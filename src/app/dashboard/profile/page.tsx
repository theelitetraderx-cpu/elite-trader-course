"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/utils";
import { Shield, Loader2, Lock, Mail } from "lucide-react";
import { CONTACT } from "@/lib/constants";

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  expiry_date?: string;
  last_login?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetch("/api/student/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setProfile(data.user);
          setFullName(data.user.full_name);
          setEmail(data.user.email);
          setPhone(data.user.phone ?? "");
        } else {
          setError(data.error ?? "Failed to load profile");
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update profile");

      setProfile(data.user);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#A8A8A8]">
        <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37] mr-2" />
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass-card p-10 text-center text-[#A8A8A8]">
        {error ?? "Unable to load profile."}
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-8 max-w-2xl pb-4 sm:pb-8">
      <div>
        <p className="text-[#D4AF37] text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1">
          Account
        </p>
        <h1 className="font-heading text-xl sm:text-3xl font-bold text-white">Profile</h1>
        <p className="text-[#666] mt-1 text-xs sm:text-sm">Manage your account details</p>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center text-[#050505] font-bold text-xl sm:text-2xl shrink-0">
            {getInitials(profile.full_name)}
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-lg sm:text-xl font-semibold text-white truncate">
              {profile.full_name}
            </h2>
            <p className="text-[#D4AF37] text-xs sm:text-sm capitalize flex items-center gap-1">
              <Shield className="w-3 h-3 shrink-0" /> {profile.role}
            </p>
            <p className="text-[#666] text-xs mt-1 truncate">@{profile.username}</p>
          </div>
        </div>

        {message && <p className="text-green-400 text-sm mb-4">{message}</p>}
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSaveProfile} className="space-y-4 sm:space-y-6">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input label="Username" value={profile.username} disabled />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button type="submit" variant="gold" size="md" disabled={saving} className="w-full sm:w-auto touch-target">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>

      <Card className="p-4 sm:p-6 border-[rgba(212,175,55,0.15)]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold text-white mb-1">
              Password
            </h3>
            <p className="text-[#A8A8A8] text-xs sm:text-sm leading-relaxed mb-3">
              For security, password changes are handled by your administrator only.
              Contact support if you need your password reset.
            </p>
            <a
              href={`mailto:${CONTACT.email}`}
              className="inline-flex items-center gap-2 text-[#D4AF37] text-xs sm:text-sm hover:text-[#FFD700] transition-colors"
            >
              <Mail className="w-4 h-4" />
              {CONTACT.email}
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}





