import { getProducts } from "./productStore";
import { products as fallbackProducts } from "./products";
import { googleSitelinkCandidates, productShouldBeIndexed, SITE_URL } from "./seo";
import { landingPageUrl, seoLandingPages } from "./seoLandingPages";

export type SitemapEntry = {
  url: string;
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
    `    <changefreq>${entry.changeFrequency}</changefreq>`,
    `    <priority>${entry.priority}</priority>`,
    "  </url>",
  ].join("\n");
}

async function sitemapProducts() {
  try {
    return await getProducts();
  } catch {
    return fallbackProducts;
  }
}

const priorityProductSlugs = new Set(googleSitelinkCandidates.map((item) => item.slug));

export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  const products = await sitemapProducts();
  const entries: SitemapEntry[] = [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    ...products
      .filter(productShouldBeIndexed)
      .map((product) => ({
        url: `${SITE_URL}/products/${product.slug}`,
        changeFrequency: "weekly" as const,
        priority: priorityProductSlugs.has(product.slug) ? 0.9 : 0.8,
      })),
    ...seoLandingPages.map((page) => ({
      url: landingPageUrl(page.slug),
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    {
      url: `${SITE_URL}/policy`,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/refund`,
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];
  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());
}

export async function buildSitemapXml() {
  const entries = await buildSitemapEntries();

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries.map(sitemapUrl).join("\n"),
    "</urlset>",
    "",
  ].join("\n");
}

export async function sitemapXmlResponse() {
  const xml = await buildSitemapXml();

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Length": String(new TextEncoder().encode(xml).length),
      "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "index, follow",
    },
  });
}
