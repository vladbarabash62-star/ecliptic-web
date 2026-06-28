"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const SWIPE_HOME_LOADER_SKIP_KEY = "ecliptic:skip-loader-after-swipe-home";

function isEditableTarget(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : null;
  return Boolean(element?.closest("input, textarea, select, [contenteditable='true']"));
}

function markSwipeHomeLoaderSkip() {
  document.documentElement.classList.add("swipe-home-loader-suppressed");
  document.documentElement.dataset.pageLoaderSkip = "swipe-home";

  try {
    window.sessionStorage.setItem(SWIPE_HOME_LOADER_SKIP_KEY, String(Date.now() + 2500));
  } catch {
    // Some browser privacy modes can block sessionStorage.
  }
}

function clearSwipeHomeLoaderSkipMarker() {
  delete document.documentElement.dataset.pageLoaderSkip;
}

export default function SwipeHomeGesture() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname.startsWith("/products/")) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let navigationTimer = 0;
    let cleanupTimer = 0;

    router.prefetch("/");

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || isEditableTarget(event.target)) return;

      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      router.prefetch("/");
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!startTime || event.changedTouches.length !== 1 || isEditableTarget(event.target)) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);
      const elapsed = Date.now() - startTime;
      startTime = 0;

      if (deltaX > 38 && deltaY < 56 && elapsed < 900) {
        document.documentElement.classList.add("swipe-home-transition");
        markSwipeHomeLoaderSkip();
        navigationTimer = window.setTimeout(() => router.push("/"), 420);
        cleanupTimer = window.setTimeout(() => {
          document.documentElement.classList.remove("swipe-home-transition");
          clearSwipeHomeLoaderSkipMarker();
        }, 1200);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.clearTimeout(navigationTimer);
      window.clearTimeout(cleanupTimer);
      document.documentElement.classList.remove("swipe-home-transition");
      clearSwipeHomeLoaderSkipMarker();
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pathname, router]);

  return null;
}
