/* eslint-disable @next/next/no-img-element */
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ProductSearchGrid from "./ProductSearchGrid";

type PreviewProduct = {
  name: string;
  slug: string;
  icon: string;
  iconScale?: number;
};

export default function SwipeHomePreview() {
  const pathname = usePathname();
  const isProductPage = pathname.startsWith("/products/");
  const [products, setProducts] = useState<PreviewProduct[]>([]);
  const [isMounted, setIsMounted] = useState(isProductPage);

  useEffect(() => {
    if (isProductPage) {
      const timer = window.setTimeout(() => setIsMounted(true), 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => setIsMounted(false), 720);
    return () => window.clearTimeout(timer);
  }, [isProductPage]);

  useEffect(() => {
    if (!isProductPage || products.length) return;
    let active = true;

    fetch("/api/products", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { products?: PreviewProduct[] } | null) => {
        if (active && Array.isArray(payload?.products)) setProducts(payload.products);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [isProductPage, products.length]);

  if (!isMounted) return null;

  return (
    <div className="swipe-home-preview" aria-hidden="true">
      <main className="min-h-screen w-full overflow-hidden bg-black px-4 py-6 text-white sm:py-12">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="page-intro mb-6 text-center sm:mb-8">
            <h1 className="flex items-center justify-center gap-2 text-4xl font-bold sm:gap-3 sm:text-5xl md:text-7xl">
              <span>Ecliptic Store</span>
              <img src="/loading-icon.png" alt="" width="80" height="80" className="h-[1.45em] w-[1.45em] object-contain" />
            </h1>
          </div>
          <ProductSearchGrid products={products} />
        </div>
      </main>
    </div>
  );
}
