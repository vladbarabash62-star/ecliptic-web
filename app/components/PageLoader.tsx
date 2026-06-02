"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  const [visible, setVisible] = useState(true);
  const pathname = usePathname();
  const hideTimer = useRef<number | null>(null);
  const fallbackTimer = useRef<number | null>(null);

  const clearTimers = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
    hideTimer.current = null;
    fallbackTimer.current = null;
  };

  const hideSoon = (delay = 760) => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setVisible(false), delay);
  };

  useEffect(() => {
    hideSoon(760);
    return clearTimers;
  }, []);

  useEffect(() => {
    setVisible(true);
    hideSoon(680);
  }, [pathname]);

  useEffect(() => {
    const showForNavigation = () => {
      setVisible(true);
      if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
      fallbackTimer.current = window.setTimeout(() => setVisible(false), 2400);
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

  if (!visible) return null;

  return (
    <div className="site-loader fixed inset-0 z-[999] flex items-center justify-center bg-[#04060c]">
      <div className="site-loader__orbit">
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
