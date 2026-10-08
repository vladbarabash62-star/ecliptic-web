import { NextResponse } from "next/server";
import { getCustomerAdminReferralReport } from "../../../../lib/customerAuth";
import { validateAdminRequest } from "../../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { pin?: string };
  const authError = await validateAdminRequest(request, body.pin);
  if (authError) return authError;

  const users = await getCustomerAdminReferralReport();
  return NextResponse.json({ ok: true, users });
}
