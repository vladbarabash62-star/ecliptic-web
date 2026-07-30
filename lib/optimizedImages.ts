import type { Product } from "./products";

function optimizedImage(value: string | undefined) {
  return value;
}

export function withOptimizedProductImages(product: Product): Product {
  return {
    ...product,
    icon: optimizedImage(product.icon) || product.icon,
    offerIcon: optimizedImage(product.offerIcon),
    offers: product.offers.map((offer) => {
      if (offer.type === "divider") return offer;

      return {
        ...offer,
        icon: optimizedImage(offer.icon),
      };
    }),
  };
}

export function withOptimizedProductsImages(products: Product[]) {
  return products.map(withOptimizedProductImages);
}
