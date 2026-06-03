"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

type LoaderPhase = "shown" | "leaving" | "hidden";

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

export default function PageLoader() {
  const [phase, setPhase] = useState<LoaderPhase>("shown");
  const pathname = usePathname();
  const hideTimer = useRef<number | null>(null);
  const removeTimer = useRef<number | null>(null);
  const lastPathname = useRef(pathname);

  const clearTimers = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    if (removeTimer.current) window.clearTimeout(removeTimer.current);
    hideTimer.current = null;
    removeTimer.current = null;
  };

  const beginHide = () => {
    setPhase("leaving");
    if (removeTimer.current) window.clearTimeout(removeTimer.current);
    removeTimer.current = window.setTimeout(() => setPhase("hidden"), 640);
  };

  const showLoader = () => {
    clearTimers();
    setPhase("shown");
  };

  const hideSoon = (delay = 420) => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(beginHide, delay);
  };

  useEffect(() => {
    hideSoon(580);
    return clearTimers;
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("route-loader-active", phase === "shown");
    document.documentElement.classList.toggle("route-loader-leaving", phase === "leaving");

    const content = document.querySelector<HTMLElement>(".site-content");
    if (content) {
      content.style.transition =
        "opacity 620ms cubic-bezier(0.22, 1, 0.36, 1), transform 620ms cubic-bezier(0.22, 1, 0.36, 1), filter 620ms cubic-bezier(0.22, 1, 0.36, 1)";
      content.style.opacity = phase === "shown" ? "0.5" : "1";
      content.style.filter = phase === "shown" ? "blur(2px)" : "blur(0)";
      content.style.transform = phase === "shown" ? "translateY(10px) scale(0.996)" : "translateY(0) scale(1)";
    }

    return () => {
      document.documentElement.classList.remove("route-loader-active", "route-loader-leaving");
    };
  }, [phase]);

  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    showLoader();
    hideSoon(360);
  }, [pathname]);

  useEffect(() => {
    const showForNavigation = () => {
      showLoader();
      hideSoon(2400);
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
  }, []);

  if (phase === "hidden") return null;

  const loaderStyle = {
    opacity: phase === "leaving" ? 0 : 1,
    backgroundColor: phase === "leaving" ? "rgba(4, 6, 12, 0)" : "#04060c",
    backdropFilter: phase === "leaving" ? "blur(6px)" : "blur(0px)",
    transition:
      "opacity 620ms cubic-bezier(0.22, 1, 0.36, 1), background-color 620ms cubic-bezier(0.22, 1, 0.36, 1), backdrop-filter 620ms cubic-bezier(0.22, 1, 0.36, 1)",
  } satisfies CSSProperties;

  const orbitStyle = {
    opacity: phase === "leaving" ? 0 : 1,
    filter: phase === "leaving" ? "blur(2px)" : "blur(0)",
    transform: phase === "leaving" ? "scale(0.92)" : "scale(1)",
    transition:
      "opacity 560ms cubic-bezier(0.22, 1, 0.36, 1), transform 640ms cubic-bezier(0.22, 1, 0.36, 1), filter 640ms cubic-bezier(0.22, 1, 0.36, 1)",
  } satisfies CSSProperties;

  return (
    <div
      className={`site-loader fixed inset-0 z-[999] flex items-center justify-center bg-[#04060c] ${phase === "leaving" ? "site-loader--leaving" : ""}`}
      style={loaderStyle}
    >
      <div className="site-loader__orbit" style={orbitStyle}>
        <Image
          src="/loading-icon.png"
          alt="Ecliptic"
          width={180}
          height={180}
          priority
          className="site-loader__icon h-full w-full object-contain"
        />
      </div>
    </div>
  );
}
