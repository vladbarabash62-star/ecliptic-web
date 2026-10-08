import { NextResponse } from "next/server";
import { rememberManagerChat } from "../../../../lib/telegramManagerStore";
import { savePendingTelegramLogin } from "../../../../lib/telegramLoginStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: {
      id?: number;
    };
    from?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      photo_url?: string;
    };
  };
};

function botToken() {
  return process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_WEBAPP_BOT_TOKEN || "";
}

async function sendTelegramMessage(chatId: number, text: string, token: string, loginToken: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Войти в Ecliptic Store",
              url: `https://ecliptic.website/api/auth/telegram/complete?token=${encodeURIComponent(loginToken)}`,
            },
          ],
        ],
      },
    }),
  });

  return response.ok;
}

async function sendWelcomeMessage(chatId: number, token: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: [
        "Здравствуйте! Добро пожаловать в Ecliptic Store.",
        "",
        "У нас можно посмотреть цифровые товары, игровые пополнения, подписки и Telegram Stars. Ассортимент и актуальные цены доступны на сайте:",
        "https://ecliptic.website",
      ].join("\n"),
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Открыть сайт",
              url: "https://ecliptic.website",
            },
          ],
        ],
      },
    }),
  });

  return response.ok;
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  if (secret && request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const token = botToken();
  if (!token) return NextResponse.json({ ok: false }, { status: 500 });

  const update = await request.json().catch(() => ({})) as TelegramUpdate;
  const message = update.message;
  const text = message?.text || "";
  const loginToken = text.match(/^\/start\s+login_([a-f0-9-]{20,80})/i)?.[1];

  await rememberManagerChat(message?.from?.username, message?.chat?.id);

  if (!loginToken && /^\/start(?:\s|$)/i.test(text) && message?.chat?.id) {
    await sendWelcomeMessage(message.chat.id, token);
    return NextResponse.json({ ok: true, welcome: true });
  }

  if (!loginToken || !message?.from?.id || !message.chat?.id) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const loginSaved = await savePendingTelegramLogin(loginToken, message.from);
  if (!loginSaved) {
    await sendWelcomeMessage(message.chat.id, token);
    return NextResponse.json({ ok: true, welcome: true, staleLoginToken: true });
  }

  await sendTelegramMessage(
    message.chat.id,
    "Готово. Нажмите кнопку ниже, чтобы войти в личный кабинет Ecliptic Store.",
    token,
    loginToken
  );

  return NextResponse.json({ ok: true });
}
