"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HomeButton() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <Link
      href="/"
      aria-label="На главную"
      className="fixed left-2 top-3 z-50 hidden transition-all duration-300 hover:scale-105 active:scale-95 md:block"
    >
      <img
        src="/ecliptic-logo.svg"
        alt="Ecliptic Store"
        className="h-[3cm] w-[6cm] object-contain"
      />
    </Link>
  );
}