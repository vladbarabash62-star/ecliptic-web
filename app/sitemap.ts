import type { MetadataRoute } from "next";
import { getProducts } from "../lib/productStore";
import { products as fallbackProducts } from "../lib/products";
import { productShouldBeIndexed, SITE_URL } from "../lib/seo";
import { landingPageUrl, seoLandingPages } from "../lib/seoLandingPages";

// Keep the sitemap aligned with the admin catalog immediately after a save.
// A stale generated sitemap was making Search Console validate old URL sets.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts({ cached: false }).catch(() => fallbackProducts);
  const urls = [
    SITE_URL,
    ...products.filter(productShouldBeIndexed).map((product) => `${SITE_URL}/products/${product.slug}`),
    ...seoLandingPages.map((page) => landingPageUrl(page.slug)),
    `${SITE_URL}/policy`,
    `${SITE_URL}/terms`,
    `${SITE_URL}/refund`,
  ];

  return Array.from(new Set(urls)).map((url) => ({ url }));
}
