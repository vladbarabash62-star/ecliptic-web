import { NextResponse } from "next/server";

import { SITE_URL } from "../../lib/seo";

export async function GET() {
  return NextResponse.redirect(`${SITE_URL}/sitemap.xml`, 308);
}
