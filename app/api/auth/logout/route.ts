import { NextResponse } from "next/server";
import { clearCustomerSession } from "../../../../lib/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearCustomerSession(response);
  return response;
}
