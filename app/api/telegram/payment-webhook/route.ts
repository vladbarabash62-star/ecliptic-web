import { NextResponse } from "next/server";
import { getManagerChatId, rememberManagerChat } from "../../../../lib/telegramManagerStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramMessage = {
  chat?: { id?: number };
  from?: { id?: number; username?: string; first_name?: string; last_name?: string };
  text?: string;
  caption?: string;
  photo?: Array<{ file_id: string; width?: number; height?: number }>;
  document?: { file_id: string; mime_type?: string; file_name?: string };
};

type TelegramUpdate = {
  message?: TelegramMessage;
  callback_query?: {
    id?: string;
    data?: string;
    from?: { id?: number; username?: string };
    message?: TelegramMessage & { message_id?: number };
  };
};

function token() {
  // Keep the dedicated payment bot isolated from the existing login bot.
  return process.env.PAYMENT_BOT_TOKEN_V4 || process.env.PAYMENT_BOT_TOKEN_V3 || process.env.PAYMENT_BOT_TOKEN_V2 || process.env.PAYMENT_BOT_TOKEN || "";
}

function tokenSource() {
  if (process.env.PAYMENT_BOT_TOKEN_V4) return "V4";
  if (process.env.PAYMENT_BOT_TOKEN_V3) return "V3";
  if (process.env.PAYMENT_BOT_TOKEN_V2) return "V2";
  if (process.env.PAYMENT_BOT_TOKEN) return "legacy";
  return "none";
}

async function telegram(method: string, body: Record<string, unknown>) {
  const botToken = token();
  console.info("Payment bot token status", { configured: Boolean(botToken), length: botToken.length });
  if (!botToken) return null;
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!response) {
    console.error("Telegram API request failed", method);
    return null;
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    console.error("Telegram API rejected request", method, response.status, payload?.description || "unknown error");
    return null;
  }
  return payload;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function sendWelcome(chatId: number) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text: [
      "Здравствуйте! Это бот проверки оплаты Ecliptic Store.",
      "",
      "После перевода отправьте сюда скриншот операции. Менеджер проверит его и сообщит результат.",
    ].join("\n"),
  });
}

async function forwardPayment(message: TelegramMessage) {
  const managerChatId = await getManagerChatId();
  const customerChatId = Number(message.chat?.id);
  if (!managerChatId || !Number.isFinite(customerChatId)) return false;

  const sender = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ") || "не указано";
  const username = message.from?.username ? `@${message.from.username}` : "не указан";
  const caption = message.caption?.trim() || "Без подписи";
  const managerText = [
    "🧾 <b>Новая заявка на проверку оплаты</b>",
    "",
    `Клиент: <b>${escapeHtml(sender)}</b>`,
    `Telegram: <b>${escapeHtml(username)}</b>`,
    `Chat ID: <code>${customerChatId}</code>`,
    `Комментарий: ${escapeHtml(caption)}`,
    "",
    "Проверьте сумму, получателя, последние цифры карты и время операции.",
  ].join("\n");
  const callbackBase = String(customerChatId);
  const replyMarkup = {
    inline_keyboard: [[
      { text: "✅ Подтвердить оплату", callback_data: `pay:approve:${callbackBase}` },
      { text: "❌ Отклонить", callback_data: `pay:reject:${callbackBase}` },
    ]],
  };

  if (message.photo?.length) {
    const largest = message.photo[message.photo.length - 1];
    await telegram("sendPhoto", {
      chat_id: managerChatId,
      photo: largest.file_id,
      caption: managerText,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    });
    return true;
  }

  if (message.document?.file_id) {
    await telegram("sendDocument", {
      chat_id: managerChatId,
      document: message.document.file_id,
      caption: managerText,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    });
    return true;
  }

  return false;
}

async function handleDecision(update: TelegramUpdate) {
  const callback = update.callback_query;
  const data = callback?.data || "";
  const managerChatId = await getManagerChatId();
  const callbackChatId = String(callback?.message?.chat?.id || "");
  if (!callback || callbackChatId !== String(managerChatId)) return false;

  const match = data.match(/^pay:(approve|reject):(-?\d+)$/);
  if (!match) return false;
  const [, decision, customerChatId] = match;
  const approved = decision === "approve";
  await telegram("answerCallbackQuery", {
    callback_query_id: callback.id,
    text: approved ? "Оплата подтверждена" : "Оплата отклонена",
    show_alert: false,
  });
  await telegram("editMessageReplyMarkup", {
    chat_id: callbackChatId,
    message_id: callback.message?.message_id,
    reply_markup: { inline_keyboard: [] },
  });
  await telegram("sendMessage", {
    chat_id: customerChatId,
    text: approved
      ? "✅ Оплата принята. Заказ передан в работу."
      : "❌ Не удалось подтвердить оплату. Проверьте сумму и отправьте актуальный скриншот операции.",
  });
  return true;
}

export async function POST(request: Request) {
  if (!token()) return NextResponse.json({ ok: false, error: "PAYMENT_BOT_TOKEN is not configured" }, { status: 500 });
  const expectedSecret = process.env.PAYMENT_TELEGRAM_WEBHOOK_SECRET || "";
  if (expectedSecret && request.headers.get("x-telegram-bot-api-secret-token") !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const update = await request.json().catch(() => ({})) as TelegramUpdate;
  if (await handleDecision(update)) return NextResponse.json({ ok: true, decision: true });

  const message = update.message;
  if (!message?.chat?.id) return NextResponse.json({ ok: true, ignored: true });
  await rememberManagerChat(message.from?.username, message.chat.id).catch(() => undefined);
  if (/^\/start(?:\s|$)/i.test(message.text || "")) {
    await sendWelcome(message.chat.id);
    return NextResponse.json({ ok: true, welcome: true, botConfigured: Boolean(token()), tokenSource: tokenSource() });
  }
  const forwarded = await forwardPayment(message);
  if (!forwarded && (message.photo?.length || message.document?.file_id)) {
    await telegram("sendMessage", { chat_id: message.chat.id, text: "Не удалось передать чек менеджеру. Попробуйте ещё раз позже." });
  }
  return NextResponse.json({ ok: true, forwarded });
}
