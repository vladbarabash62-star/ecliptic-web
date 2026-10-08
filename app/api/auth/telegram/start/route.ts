import { NextResponse } from "next/server";
import { createTelegramLoginToken } from "../../../../../lib/telegramLoginStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getTelegramBotUsername() {
  const username =
    process.env.NEXT_PUBLIC_TELEGRAM_LOGIN_BOT_USERNAME ||
    process.env.NEXT_PUBLIC_TELEGRAM_WEBAPP_BOT_USERNAME ||
    process.env.TELEGRAM_WEBAPP_BOT_USERNAME ||
    "Ecliptic_Store_BOT";

  return username.replace(/^@/, "").trim();
}

export async function POST() {
  const bot = getTelegramBotUsername();
  if (!/^[a-zA-Z0-9_]{5,32}$/.test(bot)) {
    return NextResponse.json({ ok: false, error: "Telegram bot is not configured" }, { status: 500 });
  }

  const token = createTelegramLoginToken();
  return NextResponse.json({
    ok: true,
    url: `https://t.me/${bot}?start=login_${token}`,
  });
}
