/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { playProductHaptic } from "./haptics";

type ProductGroup = "all" | "services" | "games" | "social";
type ProductCard = {
  name: string;
  slug: string;
  icon: string;
  iconScale?: number;
};

const PRODUCT_GROUPS: Array<{ id: ProductGroup; label: string }> = [
  { id: "social", label: "Соцсети" },
  { id: "games", label: "Игры" },
  { id: "services", label: "Сервисы" },
];

const GAME_SLUGS = new Set([
  "steam",
  "world-of-tanks",
  "brawl-stars",
  "roblox",
  "standoff-2",
  "pubg-mobile",
  "mobile-legends",
  "clash-of-clans",
  "clash-royale",
  "free-fire",
  "gta-5-rp-majestic-rp",
  "majestic-rp",
  "arizona-rp",
  "radmir-rp",
  "amazing-rp",
  "black-russia",
  "minecraft",
  "oxide",
  "epic-games-topup",
  "playstation",
  "fortnite",
]);

const SOCIAL_SLUGS = new Set([
  "telegram-premium",
  "telegram-accounts",
  "telegram-stars",
  "tiktok",
  "youtube-premium",
  "spotify-premium",
  "discord-nitro",
  "boosty",
  "twitch",
]);

function getProductGroup(product: ProductCard): ProductGroup {
  const name = product.name.toLowerCase();

  if (GAME_SLUGS.has(product.slug)) return "games";
  if (SOCIAL_SLUGS.has(product.slug)) return "social";
  if (
    name.includes("steam") ||
    name.includes("gta") ||
    name.includes("majestic") ||
    name.includes("arizona") ||
    name.includes("аризона") ||
    name.includes("epic games") ||
    name.includes("playstation")
  ) {
    return "games";
  }
  if (name.includes("boosty") || name.includes("бусти") || name.includes("twitch") || name.includes("твич")) {
    return "social";
  }
  return "services";
}

export default function ProductSearchGrid({ products }: { products: ProductCard[] }) {
  const [activeGroup, setActiveGroup] = useState<ProductGroup>("all");

  const filteredProducts = useMemo(() => {
    if (activeGroup === "all") return products;

    return products.filter((product) => getProductGroup(product) === activeGroup);
  }, [products, activeGroup]);

  function switchGroup(group: ProductGroup) {
    if (group === activeGroup) return;
    setActiveGroup(group);
  }

  return (
    <div className="grid gap-5">
      <div className="home-reveal home-reveal--filters grid w-full justify-items-center gap-3">
        <button
          type="button"
          onClick={() => switchGroup("all")}
          className={`rounded-2xl border px-8 py-3 text-base font-black shadow-[0_18px_60px_rgba(0,0,0,0.18)] transition-all duration-300 active:scale-95 ${
            activeGroup === "all"
              ? "border-white/18 bg-white text-black"
              : "border-white/10 bg-[#07101d]/88 text-white/86 hover:bg-white/10 hover:text-white"
          }`}
        >
          Каталог
        </button>

        <div className="inline-flex max-w-full gap-2 rounded-2xl border border-white/10 bg-[#07101d]/88 p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
          {PRODUCT_GROUPS.map((group) => {
            const isActive = activeGroup === group.id;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => switchGroup(group.id)}
                className={`rounded-xl px-4 py-2 text-sm font-black transition-all duration-300 active:scale-95 sm:px-5 ${
                  isActive
                    ? "bg-white text-black shadow-[0_10px_28px_rgba(255,255,255,0.16)]"
                    : "bg-white/6 text-white/72 hover:bg-white/10 hover:text-white"
                }`}
              >
                {group.label}
              </button>
            );
          })}
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <section
          className="products-grid grid w-full grid-cols-3 gap-3 transition-all duration-200 ease-out min-[500px]:grid-cols-4 min-[500px]:gap-4"
        >
          {filteredProducts.map((product, index) => {
            return (
              <Link
                key={product.slug}
                href={`/products/${product.slug}`}
                prefetch={false}
                data-analytics="product_open"
                data-haptic-direct="true"
                data-product={product.slug}
                onPointerDown={playProductHaptic}
                style={
                  {
                    "--icon-scale": product.iconScale ?? 1,
                    "--home-card-delay": "0ms",
                  } as CSSProperties
                }
                className="home-product-card product-card group flex min-h-[154px] min-w-0 rounded-2xl border border-white/10 bg-[#0a0d14] p-3 transition-all duration-300 hover:scale-105 hover:border-white/20"
              >
                <div className="flex h-full w-full min-w-0 flex-col items-center">
                  <div className="product-icon-stage mb-3 flex aspect-square w-full items-center justify-center rounded-xl bg-[#0f1420]">
                    <img
                      src={product.icon}
                      alt={product.name}
                      className="product-icon product-grid-icon h-[64%] w-[64%] object-contain"
                      width={180}
                      height={180}
                      loading="eager"
                      fetchPriority={index < 12 ? "high" : "auto"}
                      decoding="async"
                      draggable={false}
                      onError={(event) => {
                        event.currentTarget.src = "/loading-icon.png";
                      }}
                    />
                  </div>

                  <h2 className="product-title w-full text-center text-sm font-black text-white/92 sm:text-lg">
                    {product.name}
                  </h2>
                </div>
              </Link>
            );
          })}
        </section>
      ) : (
        <div className="mx-auto w-full max-w-[680px] rounded-2xl border border-white/10 bg-[#0f1420]/88 p-5 text-center text-sm font-bold text-white/62">
          В этом разделе пока нет товаров
        </div>
      )}
    </div>
  );
}
