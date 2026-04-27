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
    <main className="min-h-screen bg-[#05070d] text-white">
      <div className="mx-auto w-full max-w-[1400px] px-3 py-6 sm:px-4">
        
        {/* HEADER */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Ecliptic Store
          </h1>

          <p className="mt-2 text-white/60 text-sm sm:text-base">
            Интернет магазин
          </p>

          {/* SEO скрытый текст */}
          <p className="hidden">
            Ecliptic Store — донат в игры в ПМР, пополнение Steam, Brawl Stars, Roblox, Telegram Premium, Standoff 2, PUBG Mobile, Free Fire, Fortnite, Genshin Impact, Valorant
          </p>
        </div>

        {/* GRID */}
        <section
          className={
            isMobileLike ? "grid grid-cols-3 gap-3" : "grid grid-cols-4 gap-4"
          }
        >
          {products.map((product) => (
            <Link
              key={product.name}
              href={`/products/${product.slug}`}
              className="group rounded-2xl border border-white/10 bg-[#0a0d14] p-3 transition-all hover:scale-105 hover:border-white/20"
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

                <h2 className="text-center text-xs sm:text-sm text-white/90">
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