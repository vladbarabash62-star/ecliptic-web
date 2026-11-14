import { NextResponse } from "next/server";
import { products as fallbackProducts } from "../../lib/products";
import { productShouldBeIndexed, SITE_URL } from "../../lib/seo";
import { landingPageUrl, seoLandingPages } from "../../lib/seoLandingPages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SITEMAP_CACHE_TTL_MS = 300_000;
let sitemapCache: { expiresAt: number; body: string } | null = null;
let sitemapInFlight: Promise<string> | null = null;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  if (!sitemapCache || sitemapCache.expiresAt <= Date.now()) {
    if (!sitemapInFlight) {
      sitemapInFlight = (async () => {
        // Keep sitemap generation independent from remote state reads. The public
        // catalog can be customized at runtime, but sitemap requests must remain
        // cheap and deterministic on the edge.
        const products = fallbackProducts;
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

        return [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
          '</urlset>',
          '',
        ].join("\n");
      })().finally(() => {
        sitemapInFlight = null;
      });
    }

    const body = await sitemapInFlight;
    sitemapCache = { expiresAt: Date.now() + SITEMAP_CACHE_TTL_MS, body };
  }

  const body = sitemapCache.body;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Length": String(Buffer.byteLength(body, "utf8")),
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
