"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ParticlesBackground } from "@/components/shared/particles-background";
import { BrandLogo } from "@/components/shared/brand-logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push(redirect || data.redirect);
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <ParticlesBackground />
      <div className="absolute inset-0 bg-gradient-to-br from-[#050505] via-[#101010] to-[#050505]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-card p-8 md:p-10">
          <div className="text-center mb-8">
            <BrandLogo
              size="hero"
              priority
              className="justify-center mb-6"
              imageClassName="shadow-[0_0_30px_rgba(212,175,55,0.35)]"
            />
            <p className="text-[#A8A8A8] text-sm uppercase tracking-wider">
              Member Login
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="username"
              label="Email or Username"
              placeholder="Enter your email or username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />

            <div className="relative">
              <Input
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-[#A8A8A8] hover:text-[#FFD700]"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[rgba(212,175,55,0.3)] bg-[#101010] text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="text-sm text-[#A8A8A8]">Remember Me</span>
              </label>
              <button
                type="button"
                className="text-sm text-[#D4AF37] hover:text-[#FFD700] transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" variant="gold" size="lg" className="w-full" loading={loading}>
              Login
            </Button>
          </form>

          <p className="text-center text-[#A8A8A8] text-xs mt-8">
            Access is by invitation only. Contact admin for enrollment.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <LoginForm />
    </Suspense>
  );
}
