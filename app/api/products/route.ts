import { NextResponse } from "next/server";
import { withOptimizedProductsImages } from "../../../lib/optimizedImages";
import { getProducts } from "../../../lib/productStore";
import type { Product, ProductOffer } from "../../../lib/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicOffer(offer: Product["offers"][number]) {
  if (offer.type === "divider") {
    return {
      type: "divider" as const,
      title: offer.title,
      description: offer.description,
    };
  }

  const productOffer = offer as ProductOffer;
  return {
    label: productOffer.label,
    priceRub: productOffer.priceRub,
    icon: productOffer.icon,
    iconScale: productOffer.iconScale,
  };
}

function publicProduct(product: Product) {
  return {
    name: product.name,
    slug: product.slug,
    icon: product.icon,
    iconScale: product.iconScale,
    offers: product.offers.map(publicOffer),
  };
}

export async function GET() {
  const products = withOptimizedProductsImages(await getProducts({ cached: true }));
  return NextResponse.json(
    { ok: true, products: products.map(publicProduct) },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
      },
    }
  );
}
