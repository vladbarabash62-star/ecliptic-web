"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function HomeButton() {
  const pathname = usePathname();
  const [hideButton, setHideButton] = useState(true);

  useEffect(() => {
    const isTelegram =
      typeof window !== "undefined" &&
      (
        (window as any).Telegram?.WebApp ||
        window.location.hash.includes("tgWebAppData") ||
        window.navigator.userAgent.toLowerCase().includes("telegram")
      );

    setHideButton(pathname === "/" || isTelegram);
  }, [pathname]);

  if (hideButton) return null;

  return (
    <Link
      href="/"
      aria-label="На главную"
      className="fixed left-2 top-3 z-50 block transition-all duration-300 hover:scale-105 active:scale-95"
    >
      <img
        src="/ecliptic-logo.svg"
        alt="Ecliptic Store"
        className="h-[3cm] w-[6cm] object-contain"
      />
    </Link>
  );
}