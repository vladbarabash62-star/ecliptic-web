import { NextResponse } from "next/server";
import { getSiteSettings } from "../../../lib/siteSettings";
import { defaultSiteSettings } from "../../../lib/siteSettingsDefaults";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSiteSettings().catch(() => defaultSiteSettings);
  return NextResponse.json({ ok: true, settings });
}
