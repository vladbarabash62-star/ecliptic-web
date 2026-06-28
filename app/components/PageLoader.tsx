"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type LoaderPhase = "shown" | "leaving" | "hidden";

const SWIPE_HOME_LOADER_SKIP_KEY = "ecliptic:skip-loader-after-swipe-home";

function isMobileViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
}

function isInternalNavigationLink(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  try {
    const url = new URL(anchor.href);
    if (url.origin !== window.location.origin) return false;
    return url.href !== window.location.href;
  } catch {
    return false;
  }
}

function shouldSkipLoaderForSwipeHome() {
  if (typeof document === "undefined" || typeof window === "undefined") return false;
  if (document.documentElement.dataset.pageLoaderSkip === "swipe-home") return true;
  if (document.documentElement.classList.contains("swipe-home-transition")) return true;

  try {
    const expiresAt = Number(window.sessionStorage.getItem(SWIPE_HOME_LOADER_SKIP_KEY) || "0");
    if (expiresAt > Date.now()) return true;
    if (expiresAt) window.sessionStorage.removeItem(SWIPE_HOME_LOADER_SKIP_KEY);
  } catch {
    return false;
  }

  return false;
}

function consumeSwipeHomeLoaderSkip() {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(SWIPE_HOME_LOADER_SKIP_KEY);
  } catch {
    // Some browser privacy modes can block sessionStorage.
  }

  delete document.documentElement.dataset.pageLoaderSkip;
  document.documentElement.classList.remove("page-loader-active", "page-loader-leaving");
  window.setTimeout(() => {
    document.documentElement.classList.remove("swipe-home-loader-suppressed");
  }, 900);
}

function markSwipeHomeLoaderSkip() {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  document.documentElement.classList.add("swipe-home-loader-suppressed");
  document.documentElement.dataset.pageLoaderSkip = "swipe-home";

  try {
    window.sessionStorage.setItem(SWIPE_HOME_LOADER_SKIP_KEY, String(Date.now() + 2500));
  } catch {
    // Some browser privacy modes can block sessionStorage.
  }
}

export default function PageLoader() {
  const [phase, setPhase] = useState<LoaderPhase>(() => {
    if (typeof window !== "undefined" && window.location.pathname === "/" && shouldSkipLoaderForSwipeHome()) {
      return "hidden";
    }

    return "shown";
  });
  const pathname = usePathname();
  const hideTimer = useRef<number | null>(null);
  const removeTimer = useRef<number | null>(null);
  const lastPathname = useRef(pathname);

  const clearTimers = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    if (removeTimer.current) window.clearTimeout(removeTimer.current);
    hideTimer.current = null;
    removeTimer.current = null;
  }, []);

  const hideLoader = useCallback(() => {
    setPhase("leaving");
    if (removeTimer.current) window.clearTimeout(removeTimer.current);
    removeTimer.current = window.setTimeout(() => {
      removeTimer.current = null;
      setPhase("hidden");
    }, 460);
  }, []);

  const hideSoon = useCallback((delay: number) => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      hideTimer.current = null;
      hideLoader();
    }, delay);
  }, [hideLoader]);

  const showLoader = useCallback(() => {
    clearTimers();
    setPhase("shown");
  }, [clearTimers]);

  useEffect(() => {
    if (pathname === "/" && shouldSkipLoaderForSwipeHome()) {
      clearTimers();
      consumeSwipeHomeLoaderSkip();
      setPhase("hidden");
      return clearTimers;
    }

    hideSoon(650);
    return clearTimers;
  }, [clearTimers, hideSoon, pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("page-loader-active", phase === "shown");
    document.documentElement.classList.toggle("page-loader-leaving", phase === "leaving");

    return () => {
      document.documentElement.classList.remove("page-loader-active", "page-loader-leaving");
    };
  }, [phase]);

  useEffect(() => {
    const previousPathname = lastPathname.current;
    if (previousPathname === pathname) return;
    lastPathname.current = pathname;

    const isMobileProductToHome = isMobileViewport() && previousPathname.startsWith("/products/") && pathname === "/";
    if (isMobileProductToHome || (pathname === "/" && shouldSkipLoaderForSwipeHome())) {
      clearTimers();
      consumeSwipeHomeLoaderSkip();
      setPhase("hidden");
      return;
    }
    showLoader();
    hideSoon(430);
  }, [clearTimers, hideSoon, pathname, showLoader]);

  useEffect(() => {
    const showForNavigation = (event?: Event) => {
      if (event?.type === "popstate" && isMobileViewport() && pathname.startsWith("/products/")) {
        markSwipeHomeLoaderSkip();
        setPhase("hidden");
        return;
      }

      if (shouldSkipLoaderForSwipeHome()) return;
      showLoader();
      hideSoon(1600);
    };

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || !isInternalNavigationLink(anchor)) return;

      showForNavigation();
    };

    window.addEventListener("popstate", showForNavigation);
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("popstate", showForNavigation);
      document.removeEventListener("click", handleClick, true);
    };
  }, [hideSoon, showLoader]);

  if (phase === "hidden") return null;

  return (
    <div className={`site-loader fixed inset-0 z-[999] grid place-items-center ${phase === "leaving" ? "site-loader--leaving" : ""}`}>
      <div className="site-loader__orbit">
        <Image
          src="/loading-icon.png"
          alt="Ecliptic Store"
          width={180}
          height={180}
          priority
          className="site-loader__icon"
        />
      </div>
    </div>
  );
}
