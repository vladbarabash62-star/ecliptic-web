"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
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

  const hideLoader = () => {
    setPhase("leaving");
    if (removeTimer.current) window.clearTimeout(removeTimer.current);
    removeTimer.current = window.setTimeout(() => {
      removeTimer.current = null;
      setPhase("hidden");
    }, 460);
  };

  const hideSoon = (delay: number) => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      hideTimer.current = null;
      hideLoader();
    }, delay);
  };

  const showLoader = () => {
    clearTimers();
    setPhase("shown");
  };

  useEffect(() => {
    hideSoon(650);
    return clearTimers;
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("page-loader-active", phase === "shown");
    document.documentElement.classList.toggle("page-loader-leaving", phase === "leaving");

    return () => {
      document.documentElement.classList.remove("page-loader-active", "page-loader-leaving");
    };
  }, [phase]);

  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    showLoader();
    hideSoon(430);
  }, [pathname]);

  useEffect(() => {
    const showForNavigation = () => {
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
  }, []);

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
