"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/api")) return;

    const qs = searchParams?.toString();
    const path = qs ? `${pathname}?${qs}` : pathname;

    const controller = new AbortController();
    void fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: path.split("?")[0],
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
      }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // tracking nie blokuje UI
    });

    return () => controller.abort();
  }, [pathname, searchParams]);

  return null;
}
