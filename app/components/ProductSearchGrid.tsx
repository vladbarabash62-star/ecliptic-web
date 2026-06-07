/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import type { Product } from "../../lib/products";
import { playProductHaptic } from "./haptics";

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase("ru")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim();
}

export default function ProductSearchGrid({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeSearch(query);

  const filteredProducts = useMemo(() => {
    if (!normalizedQuery) return products;

    return products.filter((product) => {
      const haystack = normalizeSearch(`${product.name} ${product.slug}`);
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, products]);

  return (
    <div className="grid gap-5">
      <div className="w-full">
        <label className="sr-only" htmlFor="product-search">
          Поиск
        </label>
        <input
          id="product-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск"
          autoComplete="off"
          inputMode="search"
          className="w-full rounded-2xl border border-white/12 bg-[#07101d]/88 px-5 py-4 text-base font-bold text-white outline-none shadow-[0_18px_60px_rgba(0,0,0,0.18)] transition focus:border-sky-300/45 focus:bg-[#0a1322]"
        />
      </div>

      {filteredProducts.length > 0 ? (
        <section className="products-grid grid w-full grid-cols-3 gap-3 min-[500px]:grid-cols-4 min-[500px]:gap-4">
          {filteredProducts.map((product) => {
            return (
              <Link
                key={product.slug}
                href={`/products/${product.slug}`}
                prefetch
                data-analytics="product_open"
                data-haptic-direct="true"
                data-product={product.slug}
                onPointerDown={playProductHaptic}
                style={{ "--icon-scale": product.iconScale ?? 1 } as CSSProperties}
                className="product-card group flex min-h-[154px] min-w-0 rounded-2xl border border-white/10 bg-[#0a0d14] p-3 transition-all duration-300 hover:scale-105 hover:border-white/20"
              >
                <div className="flex h-full w-full min-w-0 flex-col items-center">
                  <div className="product-icon-stage mb-3 flex aspect-square w-full items-center justify-center rounded-xl bg-[#0f1420]">
                    <img
                      src={product.icon}
                      alt={product.name}
                      className="product-icon product-grid-icon h-[64%] w-[64%] object-contain"
                      fetchPriority="high"
                      loading="eager"
                      decoding="sync"
                      draggable={false}
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
          Ничего не найдено
        </div>
      )}
    </div>
  );
}
