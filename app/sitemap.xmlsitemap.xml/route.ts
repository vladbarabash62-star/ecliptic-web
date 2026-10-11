import { buildSitemapXml, sitemapXmlResponse } from "../../lib/sitemapXml";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  return sitemapXmlResponse(await buildSitemapXml());
}
