"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const SWIPE_HOME_LOADER_SKIP_KEY = "ecliptic:skip-loader-after-swipe-home";

function isEditableTarget(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : null;
  return Boolean(element?.closest("input, textarea, select, [contenteditable='true'], .floating-referral-star"));
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
    let cancelTimer = 0;

    const clearDragStyle = () => {
      document.documentElement.style.removeProperty("--swipe-home-delta");
      document.documentElement.style.removeProperty("--swipe-home-direction");
      document.documentElement.classList.remove("swipe-home-dragging", "swipe-home-cancel");
    };

    router.prefetch("/");

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || isEditableTarget(event.target)) return;

      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      router.prefetch("/");
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!startTime || event.touches.length !== 1 || isEditableTarget(event.target)) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);
      if (Math.abs(deltaX) < 8 || Math.abs(deltaX) < deltaY) return;

      event.preventDefault();
      document.documentElement.classList.add("swipe-home-dragging");
      document.documentElement.classList.remove("swipe-home-cancel");
      document.documentElement.style.setProperty("--swipe-home-direction", deltaX < 0 ? "-1" : "1");
      document.documentElement.style.setProperty(
        "--swipe-home-delta",
        `${Math.sign(deltaX) * Math.min(Math.abs(deltaX), window.innerWidth)}px`
      );
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!startTime || event.changedTouches.length !== 1 || isEditableTarget(event.target)) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);
      const elapsed = Date.now() - startTime;
      startTime = 0;

      const shouldNavigate = Math.abs(deltaX) > Math.min(180, window.innerWidth * 0.28) && deltaY < 96 && elapsed < 1400;
      if (shouldNavigate) {
        document.documentElement.style.setProperty("--swipe-home-direction", deltaX < 0 ? "-1" : "1");
        document.documentElement.style.setProperty(
          "--swipe-home-delta",
          `${Math.sign(deltaX) * window.innerWidth}px`
        );
        document.documentElement.classList.remove("swipe-home-dragging");
        document.documentElement.classList.add("swipe-home-transition");
        markSwipeHomeLoaderSkip();
        navigationTimer = window.setTimeout(() => router.push("/"), 180);
        cleanupTimer = window.setTimeout(() => {
          clearDragStyle();
          document.documentElement.classList.remove("swipe-home-transition");
          clearSwipeHomeLoaderSkipMarker();
        }, 1200);
      } else if (document.documentElement.classList.contains("swipe-home-dragging")) {
        document.documentElement.classList.remove("swipe-home-dragging");
        document.documentElement.classList.add("swipe-home-cancel");
        cancelTimer = window.setTimeout(clearDragStyle, 280);
      }
    };

    const handleTouchCancel = () => {
      startTime = 0;
      document.documentElement.classList.remove("swipe-home-dragging");
      document.documentElement.classList.add("swipe-home-cancel");
      cancelTimer = window.setTimeout(clearDragStyle, 280);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      window.clearTimeout(navigationTimer);
      window.clearTimeout(cleanupTimer);
      window.clearTimeout(cancelTimer);
      clearDragStyle();
      document.documentElement.classList.remove("swipe-home-transition");
      clearSwipeHomeLoaderSkipMarker();
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [pathname, router]);

  return null;
}
