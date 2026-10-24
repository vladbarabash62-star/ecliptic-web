import { NextResponse } from "next/server";
import { getProducts } from "../../lib/productStore";
import { products as fallbackProducts } from "../../lib/products";
import { productShouldBeIndexed, SITE_URL } from "../../lib/seo";
import { landingPageUrl, seoLandingPages } from "../../lib/seoLandingPages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const products = await getProducts({ cached: false }).catch(() => fallbackProducts);
  const urls = Array.from(new Set([
    `${SITE_URL.replace(/\/$/, "")}/`,
    ...products.filter(productShouldBeIndexed).map((product) => `${SITE_URL.replace(/\/$/, "")}/products/${product.slug}`),
    ...seoLandingPages.map((page) => landingPageUrl(page.slug)),
    `${SITE_URL.replace(/\/$/, "")}/policy`,
    `${SITE_URL.replace(/\/$/, "")}/terms`,
    `${SITE_URL.replace(/\/$/, "")}/refund`,
  ]));

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
    '</urlset>',
    '',
  ].join("\n");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Length": String(Buffer.byteLength(body, "utf8")),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "X-Robots-Tag": "noindex",
    },
  });
}
