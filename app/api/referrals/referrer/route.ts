import { NextResponse } from "next/server";
import { cleanReferralCode, getCustomerReferrerByCode } from "../../../../lib/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const code = cleanReferralCode(new URL(request.url).searchParams.get("code"));
  const referrer = code ? await getCustomerReferrerByCode(code) : null;

  return NextResponse.json(
    { ok: true, referrer },
    { headers: { "Cache-Control": "no-store" } },
  );
}
