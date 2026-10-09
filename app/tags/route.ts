import { NextResponse } from "next/server";
import { SITE_URL } from "../../lib/seo";

export function GET() {
  const response = NextResponse.redirect(SITE_URL, 308);
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
  return response;
}
