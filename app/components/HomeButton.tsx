"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HomeButton() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <Link
      href="/"
      aria-label="На главную"
      className="site-home-button fixed left-5 top-4 z-50 hidden transition-all duration-300 hover:scale-105 active:scale-95 md:block"
    >
      <Image
        src="/loading-icon.png"
        alt="Ecliptic Store"
        width={280}
        height={210}
        className="h-[4.2cm] w-[5.6cm] object-contain"
        priority
      />
    </Link>
  );
}
