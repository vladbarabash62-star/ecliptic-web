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
    <main className="relative min-h-screen w-full overflow-x-hidden bg-transparent px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-[1400px]">
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
            isMobileLike
              ? "grid w-full grid-cols-3 gap-3"
              : "grid w-full grid-cols-4 gap-4"
          }
        >
          {products.map((product) => (
            <Link
              key={product.name}
              href={`/products/${product.slug}`}
              className="group min-w-0 rounded-2xl border border-white/10 bg-[#0a0d14] p-3 transition-all duration-300 hover:scale-105 hover:border-white/20"
            >
              <div className="flex min-w-0 flex-col items-center">
                <div className="mb-2 flex aspect-square w-full items-center justify-center rounded-xl bg-[#0f1420]">
                  <img
                    src={product.icon}
                    alt={product.name}
                    className="h-[80px] w-[80px] object-contain sm:h-[110px] sm:w-[110px]"
                    loading="lazy"
                    draggable={false}
                  />
                </div>

                <h2 className="w-full truncate text-center text-xs text-white/90 sm:text-sm">
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