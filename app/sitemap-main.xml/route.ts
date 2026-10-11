import { sitemapXmlResponse } from "../../lib/sitemapXml";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  return sitemapXmlResponse();
}
