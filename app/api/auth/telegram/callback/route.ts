import { NextRequest, NextResponse } from "next/server";
import { setCustomerSession, telegramUserToCustomer, verifyTelegramLoginData } from "../../../../../lib/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value.slice(0, 180);
}

export async function GET(request: NextRequest) {
  const user = verifyTelegramLoginData(request.nextUrl.searchParams);
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));

  if (!user?.id) {
    return NextResponse.redirect(new URL(`/?auth_error=telegram`, request.url), 302);
  }

  const customer = await telegramUserToCustomer(user);
  const response = NextResponse.redirect(new URL(returnTo, request.url), 302);
  setCustomerSession(response, customer);
  return response;
}
