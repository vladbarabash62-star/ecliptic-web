import { NextRequest, NextResponse } from "next/server";
import { setCustomerSession, telegramUserToCustomer } from "../../../../../lib/customerAuth";
import { consumePendingTelegramLogin } from "../../../../../lib/telegramLoginStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const login = await consumePendingTelegramLogin(token);
  const telegramUser = login?.user;

  if (!telegramUser?.id) {
    return NextResponse.redirect(new URL("/?auth_error=telegram_expired", request.url), 302);
  }

  const customer = await telegramUserToCustomer(telegramUser, login?.referrerCode);
  const response = NextResponse.redirect(new URL("/account", request.url), 302);
  setCustomerSession(response, customer);
  return response;
}
