import { existsSync } from "fs";
import { join } from "path";
import type { Product } from "./products";

function isInlineImage(value?: string) {
  return Boolean(value?.startsWith("data:image/"));
}

const optimizedPathCache = new Map<string, string>();

const LOCAL_PRODUCT_ICON_OVERRIDES: Record<string, string> = {
  "telegram-stars": "/optimized-icons/telegram-stars-offer-0.webp",
  "pubg-mobile": "/catalog-assets/pubg-mobile-icon.svg",
  "free-fire": "/catalog-assets/free-fire-icon.svg",
  "fortnite": "/backup-assets/74e1fe12e87336151ead62ee.png",
};

function optimizedIconPath(slug: string, suffix: string) {
  const path = `/optimized-icons/${slug}-${suffix}.webp`;
  const cached = optimizedPathCache.get(path);
  if (cached !== undefined) return cached;

  const filePath = join(process.cwd(), "public", path);
  const resolved = existsSync(filePath) ? path : "";
  optimizedPathCache.set(path, resolved);
  return resolved;
}

function optimizedImage(value: string | undefined, slug: string, suffix: string) {
  if (isInlineImage(value)) return value;
  return optimizedIconPath(slug, suffix) || value;
}

export function withOptimizedProductImages(product: Product): Product {
  const localIcon = LOCAL_PRODUCT_ICON_OVERRIDES[product.slug];

  return {
    ...product,
    icon: localIcon || optimizedImage(product.icon, product.slug, "icon") || product.icon,
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
