import { existsSync } from "fs";
import { join } from "path";
import type { Product } from "./products";

function isInlineImage(value?: string) {
  return Boolean(value?.startsWith("data:image/"));
}

function optimizedIconPath(slug: string, suffix: string) {
  const path = `/optimized-icons/${slug}-${suffix}.webp`;
  const filePath = join(process.cwd(), "public", path);
  return existsSync(filePath) ? path : "";
}

function optimizedImage(value: string | undefined, slug: string, suffix: string) {
  if (!isInlineImage(value)) return value;
  return optimizedIconPath(slug, suffix) || value;
}

export function withOptimizedProductImages(product: Product): Product {
  return {
    ...product,
    icon: optimizedImage(product.icon, product.slug, "icon") || product.icon,
    offerIcon: optimizedImage(product.offerIcon, product.slug, "offer-icon"),
    offers: product.offers.map((offer, index) => {
      if (offer.type === "divider") return offer;

      return {
        ...offer,
        icon: optimizedImage(offer.icon, product.slug, `offer-${index}`),
      };
    }),
  };
}

export function withOptimizedProductsImages(products: Product[]) {
  return products.map(withOptimizedProductImages);
}
