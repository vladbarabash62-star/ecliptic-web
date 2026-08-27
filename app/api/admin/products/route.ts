import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getProducts, PRODUCTS_CACHE_TAG, saveProducts } from "../../../../lib/productStore";
import type { Product } from "../../../../lib/products";
import { validateAdminRequest } from "../../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEEP_IMAGE = "__ECLIPTIC_KEEP_IMAGE__";

type RequestBody = {
  pin?: string;
  products?: Product[];
  productPatches?: Product[];
  productOrder?: string[];
  deletedSlugs?: string[];
};

function hydrateKeptImages(nextProducts: Product[], currentProducts: Product[]) {
  const currentBySlug = new Map(currentProducts.map((product) => [product.slug, product]));

  return nextProducts.map((product) => {
    const currentProduct = currentBySlug.get(product.slug);
    const currentOffers = currentProduct?.offers || [];

    return {
      ...product,
      icon: product.icon === KEEP_IMAGE ? currentProduct?.icon || product.icon : product.icon,
      offerIcon: product.offerIcon === KEEP_IMAGE ? currentProduct?.offerIcon : product.offerIcon,
      offers: product.offers.map((offer, index) => {
        if (offer.type === "divider") return offer;
        if (offer.icon !== KEEP_IMAGE) return offer;

        const currentOffer = currentOffers[index];
        const matchingOffer =
          currentOffer?.type !== "divider" && currentOffer?.label === offer.label
            ? currentOffer
            : currentOffers.find((item) => item.type !== "divider" && item.label === offer.label);

        return {
          ...offer,
          icon: matchingOffer?.type !== "divider" ? matchingOffer?.icon : undefined,
        };
      }),
    };
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const authError = await validateAdminRequest(request, body.pin);
  if (authError) return authError;

  if (Array.isArray(body.productPatches) && Array.isArray(body.productOrder)) {
    const currentProducts = await getProducts();
    const deletedSlugs = new Set(body.deletedSlugs || []);
    const currentBySlug = new Map(currentProducts.filter((product) => !deletedSlugs.has(product.slug)).map((product) => [product.slug, product]));
    const patches = hydrateKeptImages(body.productPatches, currentProducts);

    for (const product of patches) {
      currentBySlug.set(product.slug, product);
    }

    const usedSlugs = new Set<string>();
    const orderedProducts = body.productOrder
      .map((slug) => currentBySlug.get(slug))
      .filter((product): product is Product => {
        if (!product || usedSlugs.has(product.slug)) return false;
        usedSlugs.add(product.slug);
        return true;
      });
    const remainingProducts = Array.from(currentBySlug.values()).filter((product) => !usedSlugs.has(product.slug));
    const products = [...orderedProducts, ...remainingProducts];

    await saveProducts(products);
    revalidateTag(PRODUCTS_CACHE_TAG, "max");
    revalidatePath("/", "page");
    revalidatePath("/shop", "page");
    revalidatePath("/tags", "page");
    for (const product of products) {
      revalidatePath(`/products/${product.slug}`, "page");
    }
    return NextResponse.json({ ok: true, saved: true });
  }

  if (Array.isArray(body.products)) {
    const products = hydrateKeptImages(body.products, await getProducts());
    await saveProducts(products);
    revalidateTag(PRODUCTS_CACHE_TAG, "max");
    revalidatePath("/", "page");
    revalidatePath("/shop", "page");
    revalidatePath("/tags", "page");
    for (const product of products) {
      revalidatePath(`/products/${product.slug}`, "page");
    }
    return NextResponse.json({ ok: true, saved: true });
  }

  const products = await getProducts();
  return NextResponse.json({ ok: true, saved: false, products });
}
