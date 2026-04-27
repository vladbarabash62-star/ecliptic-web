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
    <main className="relative min-h-screen overflow-hidden bg-[#04060c] text-white">
      <div className="stars-layer stars-layer-1" />
      <div className="stars-layer stars-layer-2" />
      <div className="stars-layer stars-layer-3" />

      <style jsx global>{`
        .stars-layer {
          pointer-events: none;
          position: fixed;
          inset: 0;
          z-index: 0;
          background-repeat: repeat;
        }

        .stars-layer-1 {
          background-image:
            radial-gradient(2px 2px at 2% 6%, rgba(255,255,255,1), transparent),
            radial-gradient(1px 1px at 5% 22%, rgba(255,255,255,0.95), transparent),
            radial-gradient(2px 2px at 8% 47%, rgba(255,255,255,1), transparent),
            radial-gradient(1px 1px at 4% 78%, rgba(255,255,255,0.9), transparent),
            radial-gradient(2px 2px at 14% 14%, rgba(255,255,255,1), transparent),
            radial-gradient(1px 1px at 18% 36%, rgba(255,255,255,0.9), transparent),
            radial-gradient(2px 2px at 86% 10%, rgba(255,255,255,1), transparent),
            radial-gradient(1px 1px at 92% 25%, rgba(255,255,255,0.95), transparent),
            radial-gradient(2px 2px at 96% 52%, rgba(255,255,255,1), transparent),
            radial-gradient(1px 1px at 90% 76%, rgba(255,255,255,0.9), transparent);
          animation: twinkleFast 1.5s infinite ease-in-out;
        }

        .stars-layer-2 {
          background-image:
            radial-gradient(1.5px 1.5px at 1% 35%, rgba(255,255,255,0.95), transparent),
            radial-gradient(2px 2px at 7% 63%, rgba(255,255,255,1), transparent),
            radial-gradient(1px 1px at 12% 88%, rgba(255,255,255,0.9), transparent),
            radial-gradient(2px 2px at 21% 8%, rgba(255,255,255,1), transparent),
            radial-gradient(1.5px 1.5px at 78% 18%, rgba(255,255,255,0.95), transparent),
            radial-gradient(2px 2px at 84% 42%, rgba(255,255,255,1), transparent),
            radial-gradient(1px 1px at 95% 70%, rgba(255,255,255,0.9), transparent),
            radial-gradient(2px 2px at 98% 90%, rgba(255,255,255,1), transparent);
          animation: twinkleMedium 2.1s infinite ease-in-out;
        }

        .stars-layer-3 {
          background-image:
            radial-gradient(1px 1px at 3% 12%, rgba(255,255,255,0.85), transparent),
            radial-gradient(1px 1px at 6% 55%, rgba(255,255,255,0.85), transparent),
            radial-gradient(1px 1px at 10% 30%, rgba(255,255,255,0.85), transparent),
            radial-gradient(1px 1px at 16% 68%, rgba(255,255,255,0.85), transparent),
            radial-gradient(1px 1px at 82% 6%, rgba(255,255,255,0.85), transparent),
            radial-gradient(1px 1px at 88% 34%, rgba(255,255,255,0.85), transparent),
            radial-gradient(1px 1px at 94% 58%, rgba(255,255,255,0.85), transparent),
            radial-gradient(1px 1px at 99% 82%, rgba(255,255,255,0.85), transparent);
          animation: twinkleSlow 2.8s infinite ease-in-out;
        }

        @keyframes twinkleFast {
          0%, 100% {
            opacity: 0.15;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes twinkleMedium {
          0%, 100% {
            opacity: 0.25;
          }
          50% {
            opacity: 0.9;
          }
        }

        @keyframes twinkleSlow {
          0%, 100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.75;
          }
        }
      `}</style>

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-3 py-6 sm:px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Ecliptic Store</h1>

          <p className="mt-2 text-sm text-white/60 sm:text-base">
            Интернет магазин
          </p>

          <p className="hidden">
            Ecliptic Store — донат в игры в ПМР, пополнение Steam, Brawl Stars,
            Roblox, Telegram Premium, Standoff 2, PUBG Mobile, Free Fire,
            Fortnite, Genshin Impact, Valorant
          </p>
        </div>

        <section
          className={
            isMobileLike ? "grid grid-cols-3 gap-3" : "grid grid-cols-4 gap-4"
          }
        >
          {products.map((product) => (
            <Link
              key={product.name}
              href={`/products/${product.slug}`}
              className="group rounded-2xl border border-white/10 bg-[#0a0d14] p-3 transition-all duration-300 hover:scale-105 hover:border-white/20"
            >
              <div className="flex flex-col items-center">
                <div className="mb-2 flex aspect-square w-full items-center justify-center rounded-xl bg-[#0f1420]">
                  <img
                    src={product.icon}
                    alt={product.name}
                    className="h-[80px] w-[80px] object-contain sm:h-[110px] sm:w-[110px]"
                    loading="lazy"
                    draggable={false}
                  />
                </div>

                <h2 className="text-center text-xs text-white/90 sm:text-sm">
                  {product.name}
                </h2>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}