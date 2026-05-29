import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getProducts, PRODUCTS_CACHE_TAG, saveProducts } from "../../../../lib/productStore";
import type { Product } from "../../../../lib/products";
import { validateAdminRequest } from "../../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  pin?: string;
  products?: Product[];
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const authError = await validateAdminRequest(request, body.pin);
  if (authError) return authError;

  if (Array.isArray(body.products)) {
    const products = await saveProducts(body.products);
    revalidateTag(PRODUCTS_CACHE_TAG, "max");
    revalidatePath("/", "page");
    revalidatePath("/product-links", "page");
    for (const product of products) {
      revalidatePath(`/products/${product.slug}`, "page");
    }
    return NextResponse.json({ ok: true, saved: true, products });
  }

  const products = await getProducts();
  return NextResponse.json({ ok: true, saved: false, products });
}
