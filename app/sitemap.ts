import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "../lib/sitemapXml";

// Keep the sitemap aligned with the admin catalog immediately after a save.
// A stale generated sitemap was making Search Console validate old URL sets.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await buildSitemapEntries();

  return entries.map((entry) => ({
    url: entry.url,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
