import { NextResponse } from "next/server";
import { withOptimizedProductsImages } from "../../../lib/optimizedImages";
import { getProducts } from "../../../lib/productStore";
import type { Product, ProductOffer } from "../../../lib/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_PRODUCTS_CACHE_TTL_MS = 30_000;
let publicProductsCache: { expiresAt: number; payload: { ok: true; products: ReturnType<typeof publicProduct>[] } } | null = null;
let publicProductsInFlight: Promise<{ ok: true; products: ReturnType<typeof publicProduct>[] }> | null = null;

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
  const now = Date.now();
  if (publicProductsCache && publicProductsCache.expiresAt > now) {
    return NextResponse.json(publicProductsCache.payload, {
      headers: {
        "Cache-Control": "public, max-age=15, stale-while-revalidate=60",
        "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
      },
    });
  }

  if (!publicProductsInFlight) {
    publicProductsInFlight = (async () => {
      const products = withOptimizedProductsImages(await getProducts({ cached: false }));
      return { ok: true as const, products: products.map(publicProduct) };
    })().finally(() => {
      publicProductsInFlight = null;
    });
  }

  const payload = await publicProductsInFlight;
  publicProductsCache = { expiresAt: Date.now() + PUBLIC_PRODUCTS_CACHE_TTL_MS, payload };
  return NextResponse.json(
    payload,
    {
      headers: {
        "Cache-Control": "public, max-age=15, stale-while-revalidate=60",
        "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
      },
    }
  );
}
