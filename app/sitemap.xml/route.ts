import { getProducts } from "../../lib/productStore";
import { productShouldBeIndexed, SITE_URL } from "../../lib/seo";
import { landingPageUrl, seoLandingPages } from "../../lib/seoLandingPages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sitemapUrl(entry: SitemapEntry) {
  return [
    "  <url>",
    `    <loc>${escapeXml(entry.url)}</loc>`,
    `    <lastmod>${entry.lastModified.toISOString()}</lastmod>`,
    `    <changefreq>${entry.changeFrequency}</changefreq>`,
    `    <priority>${entry.priority}</priority>`,
    "  </url>",
  ].join("\n");
}

export async function GET() {
  const products = await getProducts();
  const now = new Date();
  const entries: SitemapEntry[] = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...products
      .filter(productShouldBeIndexed)
      .map((product) => ({
        url: `${SITE_URL}/products/${product.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ...seoLandingPages.map((page) => ({
      url: landingPageUrl(page.slug),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    {
      url: `${SITE_URL}/policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/refund`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/tags`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries.map(sitemapUrl).join("\n"),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
