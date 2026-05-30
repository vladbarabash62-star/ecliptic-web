import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug } from "../../../lib/productStore";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const product = await getProductBySlug(slug, { cached: true });

  if (!product) {
    return NextResponse.redirect(new URL("/", request.url), 307);
  }

  const productUrl = new URL(`/products/${product.slug}`, request.url);
  productUrl.searchParams.set("app", "1");

  const response = NextResponse.redirect(productUrl, 307);
  response.headers.set("Cache-Control", "private, no-cache, max-age=0, must-revalidate");
  return response;
}
