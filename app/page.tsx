"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { products } from "../lib/products";

type PlanetConfig = {
  size: number;
  top?: string;
  left?: string;
  right?: string;
  duration: string;
  delay: string;
  rotate: string;
  opacity: number;
};

function BackgroundPlanets() {
  const planets: PlanetConfig[] = [
    {
      size: 180,
      top: "6%",
      left: "-48px",
      duration: "24s",
      delay: "0s",
      rotate: "-18deg",
      opacity: 0.12,
    },
    {
      size: 120,
      top: "14%",
      right: "7%",
      duration: "20s",
      delay: "2s",
      rotate: "24deg",
      opacity: 0.1,
    },
    {
      size: 150,
      top: "44%",
      left: "2%",
      duration: "28s",
      delay: "1s",
      rotate: "12deg",
      opacity: 0.08,
    },
    {
      size: 130,
      top: "68%",
      right: "8%",
      duration: "22s",
      delay: "3s",
      rotate: "-28deg",
      opacity: 0.09,
    },
    {
      size: 90,
      top: "84%",
      left: "42%",
      duration: "18s",
      delay: "0.5s",
      rotate: "16deg",
      opacity: 0.07,
    },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {planets.map((planet, index) => (
        <div
          key={index}
          className="absolute animate-[floatPlanet_var(--duration)_ease-in-out_infinite]"
          style={
            {
              width: `${planet.size}px`,
              height: `${planet.size}px`,
              top: planet.top,
              left: planet.left,
              right: planet.right,
              opacity: planet.opacity,
              ["--duration" as string]: planet.duration,
              ["--rotate" as string]: planet.rotate,
              animationDelay: planet.delay,
            } as React.CSSProperties
          }
        >
          <div className="relative h-full w-full">
            <div className="absolute inset-[18%] rounded-full border border-white/25 bg-white/[0.04]" />
            <div className="absolute left-[-8%] top-[42%] h-[16%] w-[116%] -translate-y-1/2 rounded-full border-2 border-white/35" />
            <div className="absolute left-[50%] top-[24%] h-2 w-2 -translate-x-1/2 rounded-full bg-white/60 blur-[1px]" />
          </div>
        </div>
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(11,13,18,0.16)_55%,rgba(11,13,18,0.56)_100%)]" />
    </div>
  );
}

function BackgroundStars() {
  const stars = [
    { top: "8%", left: "18%", size: 2, delay: "0s" },
    { top: "12%", left: "62%", size: 3, delay: "1s" },
    { top: "18%", left: "84%", size: 2, delay: "0.5s" },
    { top: "26%", left: "35%", size: 2, delay: "1.5s" },
    { top: "31%", left: "71%", size: 3, delay: "0.8s" },
    { top: "42%", left: "14%", size: 2, delay: "1.2s" },
    { top: "48%", left: "58%", size: 2, delay: "0.3s" },
    { top: "56%", left: "88%", size: 3, delay: "1.8s" },
    { top: "67%", left: "25%", size: 2, delay: "1.1s" },
    { top: "74%", left: "48%", size: 3, delay: "0.6s" },
    { top: "81%", left: "76%", size: 2, delay: "1.4s" },
    { top: "88%", left: "10%", size: 2, delay: "0.9s" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((star, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-white/70 animate-[starBlink_3.2s_ease-in-out_infinite]"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: star.delay,
          }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [isMobileLike, setIsMobileLike] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobileLike(window.innerWidth < 500);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0d12] text-white animate-[pageReveal_0.9s_ease-out]">
      <style jsx global>{`
        @keyframes floatPlanet {
          0% {
            transform: translate3d(0, 0, 0) rotate(var(--rotate, 0deg));
          }
          50% {
            transform: translate3d(0, -14px, 0) rotate(var(--rotate, 0deg));
          }
          100% {
            transform: translate3d(0, 0, 0) rotate(var(--rotate, 0deg));
          }
        }

        @keyframes pageReveal {
          0% {
            opacity: 0;
            transform: scale(1.015);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes heroReveal {
          0% {
            opacity: 0;
            transform: translateY(22px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cardReveal {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes starBlink {
          0%,
          100% {
            opacity: 0.25;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.35);
          }
        }

        @keyframes glowPulse {
          0%,
          100% {
            opacity: 0.38;
            transform: scale(1);
          }
          50% {
            opacity: 0.62;
            transform: scale(1.05);
          }
        }
      `}</style>

      <BackgroundStars />
      <BackgroundPlanets />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.075),transparent_32%)]" />

      <div className="pointer-events-none absolute left-1/2 top-[84px] h-[180px] w-[560px] -translate-x-1/2 rounded-full bg-white/[0.03] blur-3xl animate-[glowPulse_7s_ease-in-out_infinite]" />

      <div className="relative mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-4 sm:py-6">
        <div className="mb-6 text-center sm:mb-8 animate-[heroReveal_0.9s_ease-out]">
          <div className="mb-3 flex justify-center">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-white/70 backdrop-blur-sm">
              Ecliptic Store
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
            <span className="block text-white/90">Добро пожаловать в</span>
            <span className="mt-1 block text-white">Ecliptic Store</span>
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/60 sm:text-base">
            Выберите нужный товар
          </p>
        </div>

        <section
          className={
            isMobileLike ? "grid grid-cols-3 gap-3" : "grid grid-cols-4 gap-4"
          }
        >
          {products.map((product, index) => (
            <Link
              key={product.name}
              href={`/products/${product.slug}`}
              style={{
                animationDelay: `${0.18 + index * 0.05}s`,
              }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(18,21,28,0.78)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-[rgba(23,27,36,0.92)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.42)] active:scale-[0.98] opacity-0 translate-y-6 animate-[cardReveal_0.7s_ease-out_forwards]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex h-full flex-col items-center p-2 sm:p-3 md:p-4">
                <div className="mb-2 flex aspect-square w-full items-center justify-center rounded-2xl border border-white/10 bg-[#0a0d14]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.icon}
                    alt={product.name}
                    className="h-[90px] w-[90px] object-contain sm:h-[120px] sm:w-[120px] md:h-[150px] md:w-[150px]"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <h3 className="min-h-[32px] text-center text-[11px] font-semibold leading-tight text-white/90 sm:text-xs md:text-sm">
                  {product.name}
                </h3>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}