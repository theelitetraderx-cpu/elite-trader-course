"use client";

import { useEffect, useState } from "react";
import type { PlatformAnalytics } from "@/lib/analytics/platform-stats";

export function usePlatformAnalytics() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((data) => {
        if (data.analytics) {
          setAnalytics(data.analytics);
        } else {
          setError(data.error ?? "Failed to load analytics");
        }
      })
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  return { analytics, loading, error };
}
