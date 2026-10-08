import { NextResponse } from "next/server";
import { cleanReferralCode, setCustomerSession, telegramUserToCustomer, verifyTelegramInitData } from "../../../../lib/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramUnsafeUser = {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    initData?: string;
    referralCode?: string;
    user?: TelegramUnsafeUser;
  };

  const verifiedUser = body.initData ? verifyTelegramInitData(body.initData) : null;
  const user = verifiedUser || body.user;
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "Откройте сайт через Telegram Mini App, чтобы войти через Telegram." }, { status: 400 });
  }

  try {
    const customer = await telegramUserToCustomer(user, cleanReferralCode(body.referralCode || ""));
    const response = NextResponse.json({ ok: true, user: customer });
    setCustomerSession(response, customer);
    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Telegram authorization failed" },
      { status: 400 }
    );
  }
}
