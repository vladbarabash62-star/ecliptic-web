"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomeButton() {
  const pathname = usePathname();
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      setIsTelegram(true);
    }
  }, []);

  // ❌ скрываем на главной и в Telegram
  if (pathname === "/" || isTelegram) return null;

  return (
    <Link href="/" className="fixed left-2 top-2 z-50">
      <img
        src="/ecliptic-logo.svg"
        alt="Home"
        className="w-12 h-12 object-contain opacity-90 hover:opacity-100 transition"
      />
    </Link>
  );
}