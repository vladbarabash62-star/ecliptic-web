import { NextResponse } from "next/server";
import { cancelCustomerReferralClaim, getCustomerAdminReferralReport, markCustomerReferralRewarded } from "../../../../lib/customerAuth";
import { validateAdminRequest } from "../../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { action?: string; pin?: string; userId?: string };
  const authError = await validateAdminRequest(request, body.pin);
  if (authError) return authError;

  try {
    if (body.action === "mark_rewarded") {
      if (!body.userId) return NextResponse.json({ ok: false, error: "Пользователь не выбран." }, { status: 400 });
      await markCustomerReferralRewarded(body.userId);
    }
    if (body.action === "cancel_claim") {
      if (!body.userId) return NextResponse.json({ ok: false, error: "Пользователь не выбран." }, { status: 400 });
      await cancelCustomerReferralClaim(body.userId);
    }

    const users = await getCustomerAdminReferralReport();
    return NextResponse.json({ ok: true, users });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Customer data storage unavailable" },
      { status: 503 }
    );
  }
}
