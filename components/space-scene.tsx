"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const stars = [
  { top: "6%", left: "8%", size: 2, delay: "0s" },
  { top: "11%", left: "24%", size: 3, delay: "0.6s" },
  { top: "15%", left: "54%", size: 2, delay: "1.1s" },
  { top: "9%", left: "88%", size: 2, delay: "1.7s" },
  { top: "23%", left: "71%", size: 3, delay: "0.8s" },
  { top: "28%", left: "16%", size: 2, delay: "1.4s" },
  { top: "34%", left: "44%", size: 2, delay: "0.4s" },
  { top: "41%", left: "82%", size: 3, delay: "1.5s" },
  { top: "52%", left: "9%", size: 2, delay: "0.9s" },
  { top: "58%", left: "36%", size: 3, delay: "1.2s" },
  { top: "65%", left: "63%", size: 2, delay: "0.3s" },
  { top: "73%", left: "90%", size: 2, delay: "1.8s" },
  { top: "81%", left: "22%", size: 3, delay: "1.1s" },
  { top: "88%", left: "48%", size: 2, delay: "0.7s" },
  { top: "92%", left: "76%", size: 2, delay: "1.6s" },
];

const planets = [
  { top: "8%", left: "-54px", size: 170, rotate: "-15deg", delay: "0s" },
  { top: "16%", right: "4%", size: 120, rotate: "22deg", delay: "0.8s" },
  { top: "43%", left: "3%", size: 140, rotate: "12deg", delay: "1.2s" },
  { top: "69%", right: "6%", size: 130, rotate: "-24deg", delay: "0.5s" },
  { top: "83%", left: "42%", size: 86, rotate: "16deg", delay: "1s" },
];

export default function SpaceScene() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {stars.map((star, index) => (
          <span
            key={`star-${index}`}
            className="absolute rounded-full bg-white/75 animate-[twinkleStar_3.4s_ease-in-out_infinite]"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: star.delay,
            }}
          />
        ))}

        {planets.map((planet, index) => (
          <div
            key={`planet-${index}`}
            className="absolute opacity-60 animate-[orbitFloat_20s_ease-in-out_infinite]"
            style={{
              top: planet.top,
              left: planet.left,
              right: planet.right,
              width: `${planet.size}px`,
              height: `${planet.size}px`,
              transform: `rotate(${planet.rotate})`,
              animationDelay: planet.delay,
            }}
          >
            <div className="relative h-full w-full">
              <div className="absolute inset-[15%] rounded-full border border-white/35 bg-white/[0.06]" />
              <div className="absolute left-[-12%] top-[48%] h-[18%] w-[124%] -translate-y-1/2 rounded-full border-2 border-white/40" />
              <div className="absolute left-[48%] top-[22%] h-2 w-2 rounded-full bg-white/75 blur-[0.5px]" />
            </div>
          </div>
        ))}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(11,13,18,0.26)_58%,rgba(11,13,18,0.62)_100%)]" />
      </div>

      {!isHome && (
        <Link
          href="/"
          aria-label="На главную"
          className="pressable fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 rounded-3xl border border-white/10 bg-black/30 p-3 backdrop-blur-md md:block"
        >
          <Image
            src="/ecliptic-logo.svg"
            alt="Ecliptic"
            width={160}
            height={160}
            className="h-40 w-40 object-contain mix-blend-screen"
            priority
          />
        </Link>
      )}
    </>
  );
}
