import { getProducts } from "./productStore";
import { products as fallbackProducts } from "./products";
import { productShouldBeIndexed, SITE_URL } from "./seo";
import { landingPageUrl, seoLandingPages } from "./seoLandingPages";

export type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
};

async function sitemapProducts() {
  try {
    return await getProducts();
  } catch {
    return fallbackProducts;
  }
}

export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  const products = await sitemapProducts();
  const now = new Date();
  const entries: SitemapEntry[] = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
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
  ];
  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());
}
