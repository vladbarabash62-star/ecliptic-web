import { NextResponse } from "next/server";
import { getCustomerReferralInfo, getCustomerUserFromCookies } from "../../../../lib/customerAuth";
import { SITE_URL } from "../../../../lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCustomerUserFromCookies();
  if (!user) return NextResponse.json({ ok: true, referral: null }, { headers: { "Cache-Control": "no-store" } });

  const referral = await getCustomerReferralInfo(user.id, SITE_URL);
  return NextResponse.json({ ok: true, referral }, { headers: { "Cache-Control": "no-store" } });
}
