import { NextResponse } from "next/server";
import { cleanReferralCode } from "../../../../../lib/customerAuth";
import { createPendingTelegramLogin } from "../../../../../lib/telegramLoginStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getTelegramBotUsername() {
  // Authentication always belongs to the login bot. Do not let an old
  // payment-bot environment variable redirect users into the Orders bot.
  const username = "Ecliptic_Store_BOT";

  return username.replace(/^@/, "").trim();
}

async function ensureLoginWebhook(request: Request) {
  const botToken = process.env.TELEGRAM_LOGIN_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_WEBAPP_BOT_TOKEN || "";
  if (!botToken) return;
  const webhookUrl = new URL("/api/telegram/webhook", request.url).toString();
  const body: Record<string, unknown> = {
    url: webhookUrl,
    allowed_updates: ["message", "callback_query"],
  };
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  if (secret) body.secret_token = secret;
  await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

export async function POST(request: Request) {
  const bot = getTelegramBotUsername();
  if (!/^[a-zA-Z0-9_]{5,32}$/.test(bot)) {
    return NextResponse.json({ ok: false, error: "Telegram bot is not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({})) as { referralCode?: string };
  const token = await createPendingTelegramLogin(cleanReferralCode(body.referralCode || ""));
  await ensureLoginWebhook(request);
  return NextResponse.json({
    ok: true,
    url: `https://t.me/${bot}?start=login_${token}`,
  });
}
