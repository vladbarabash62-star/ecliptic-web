"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { products } from "../lib/products";

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
              className="pressable group relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(18,21,28,0.78)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-[rgba(23,27,36,0.92)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.42)] active:scale-[0.98] opacity-0 translate-y-6 animate-[cardReveal_0.7s_ease-out_forwards]"
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