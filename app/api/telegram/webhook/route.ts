import { NextResponse } from "next/server";
import {
  getPendingCustomerReferralClaims,
  markCustomerReferralClaimSent,
} from "../../../../lib/customerAuth";
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendPlainTelegramMessage(chatId: number, text: string, token: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  }).catch(() => null);

  return Boolean(response?.ok);
}

async function flushPendingReferralClaims(chatId: number, token: string) {
  const pending = await getPendingCustomerReferralClaims(30);
  if (!pending.length) return;

  await sendPlainTelegramMessage(chatId, `Подключил уведомления Ecliptic Store. Ожидающих реферальных заявок: ${pending.length}.`, token);

  for (const item of pending) {
    const text = [
      "🎁 <b>Реферальная программа</b>",
      "",
      "Пользователь выполнил условия и просит подарок до <b>50 Telegram Stars</b>.",
      `Имя: <b>${escapeHtml(item.user?.name || "не указано")}</b>`,
      `Telegram: <b>${escapeHtml(item.user?.username || "не указан")}</b>`,
      `Приглашено участников: <b>${item.claim.invitedCount}</b>`,
      `Заявка: <code>${escapeHtml(item.claim.id)}</code>`,
      `ID сайта: <code>${escapeHtml(item.user?.id || item.claim.userId)}</code>`,
    ].join("\n");

    const sent = await sendPlainTelegramMessage(chatId, text, token);
    if (sent) await markCustomerReferralClaimSent(item.claim.id);
  }
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

  const managerRemembered = await rememberManagerChat(message?.from?.username, message?.chat?.id);
  if (managerRemembered && message?.chat?.id) {
    await flushPendingReferralClaims(message.chat.id, token);
  }

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
