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
  const siteOrigin = SITE_URL.replace(/\/$/, "");
  const productUrls = products
    .filter(productShouldBeIndexed)
    .map((product) => product.slug.trim().toLowerCase())
    .filter((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    .filter((slug) => !new Set(["admin", "account", "api", "go", "robots", "sitemap", "sitemap-xml"]).has(slug))
    .map((slug) => `${siteOrigin}/products/${slug}`);
  const urls = Array.from(new Set([
    `${siteOrigin}/`,
    ...productUrls,
    ...seoLandingPages.map((page) => landingPageUrl(page.slug)),
    `${siteOrigin}/policy`,
    `${siteOrigin}/terms`,
    `${siteOrigin}/refund`,
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
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
