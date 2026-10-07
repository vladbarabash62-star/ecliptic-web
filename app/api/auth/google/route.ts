import { NextResponse } from "next/server";
import { setCustomerSession, verifyGoogleCredential } from "../../../../lib/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { credential?: string };
  const credential = String(body.credential || "");
  if (!credential) return NextResponse.json({ ok: false, error: "Google token is missing" }, { status: 400 });

  try {
    const user = await verifyGoogleCredential(credential);
    const response = NextResponse.json({ ok: true, user });
    setCustomerSession(response, user);
    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Google authorization failed" },
      { status: 400 }
    );
  }
}
