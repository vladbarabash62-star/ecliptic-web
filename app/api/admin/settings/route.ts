import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getSiteSettings, saveSiteSettings, SITE_SETTINGS_CACHE_TAG } from "../../../../lib/siteSettings";
import type { SiteSettings } from "../../../../lib/siteSettingsDefaults";
import { validateAdminRequest } from "../../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  pin?: string;
  settings?: SiteSettings;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const authError = await validateAdminRequest(request, body.pin);
  if (authError) return authError;

  if (body.settings) {
    const settings = await saveSiteSettings(body.settings);
    revalidateTag(SITE_SETTINGS_CACHE_TAG, "max");
    revalidatePath("/", "page");
    return NextResponse.json({ ok: true, saved: true, settings });
  }

  const settings = await getSiteSettings();
  return NextResponse.json({ ok: true, saved: false, settings });
}
