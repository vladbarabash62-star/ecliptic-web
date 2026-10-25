import { NextResponse } from "next/server";
import {
  getManagerChatId,
  rememberBusinessManagerChat,
  rememberManagerChat,
} from "../../../../lib/telegramManagerStore";
import {
  getPendingTelegramOrder,
  savePendingTelegramOrder,
  type PendingTelegramOrder,
} from "../../../../lib/telegramPendingOrderStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramMessage = {
  message_id?: number;
  chat?: { id?: number };
  from?: { id?: number; is_bot?: boolean; username?: string; first_name?: string; last_name?: string };
  sender_business_bot?: { id?: number; username?: string; first_name?: string };
  business_connection_id?: string;
  text?: string;
  caption?: string;
  photo?: Array<{ file_id: string; width?: number; height?: number }>;
  document?: { file_id: string; mime_type?: string; file_name?: string };
};

type TelegramUpdate = {
  message?: TelegramMessage;
  business_message?: TelegramMessage;
  business_connection?: { id?: string; user_chat_id?: number; is_enabled?: boolean };
  callback_query?: {
    id?: string;
    data?: string;
    from?: { id?: number; username?: string };
    message?: TelegramMessage & { message_id?: number };
  };
};

type TelegramBusinessConnection = {
  id?: string;
  user_chat_id?: number;
  can_reply?: boolean;
};

function token() {
  // Keep the dedicated payment bot isolated from the existing login bot.
  return process.env.PAYMENT_BOT_TOKEN_V4 || process.env.PAYMENT_BOT_TOKEN_V3 || process.env.PAYMENT_BOT_TOKEN_V2 || process.env.PAYMENT_BOT_TOKEN || "";
}

async function telegram(method: string, body: Record<string, unknown>) {
  const botToken = token();
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

async function refreshBusinessConnection(connectionId: string) {
  const payload = await telegram("getBusinessConnection", {
    business_connection_id: connectionId,
  });
  return payload?.result as TelegramBusinessConnection | undefined;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function isOutgoingBusinessMessage(message: TelegramMessage) {
  // Telegram echoes messages sent by a connected business bot as business_message
  // updates. They must never be treated as a new customer order.
  return Boolean(message.sender_business_bot || message.from?.is_bot);
}

async function sendWelcome(chatId: number, businessConnectionId?: string) {
  await telegram("sendMessage", {
    chat_id: chatId,
    ...(businessConnectionId ? { business_connection_id: businessConnectionId } : {}),
    text: [
      "Здравствуйте! Это бот проверки оплаты Ecliptic Store.",
      "",
      "После перевода отправьте сюда скриншот операции. Менеджер проверит его и сообщит результат.",
    ].join("\n"),
  });
}

function extractOrderAmount(message: string) {
  const payment = message.match(/К оплате\s*:\s*([^\n]+)/i);
  if (payment?.[1]) return payment[1].trim();
  const fallback = message.match(/(?:оплате|Сумма)\s*:\s*([^\n]+)/i);
  return fallback?.[1]?.trim() || "сумму из заказа";
}

function extractOrderField(message: string, field: string) {
  const match = message.match(new RegExp(`${field}\\s*:\\s*([^\\n]+)`, "i"));
  return match?.[1]?.trim() || "не указан";
}

function extractOrderCategory(message: string) {
  const service = extractOrderField(message, "Сервис");
  if (service !== "не указан") return { label: "Сервис", value: service };

  const platform = extractOrderField(message, "Платформа");
  if (platform !== "не указан") return { label: "Сервис", value: platform };

  const game = extractOrderField(message, "Игра");
  if (game !== "не указан") return { label: "Игра", value: game };

  return { label: "Сервис", value: "не указан" };
}

function extractOrderProduct(message: string) {
  const product = extractOrderField(message, "Товар");
  const category = extractOrderCategory(message);
  const region = extractOrderField(message, "Регион");
  if (product !== "не указан") {
    if (category.value.toLowerCase() === "telegram" && region !== "не указан") {
      return `Telegram ${product} ${region}`;
    }
    return product;
  }
  const service = category.value;
  const balance = message.match(/Сумма\s*:\s*([^\n]+)/i)?.[1]?.trim();
  if (balance && /steam/i.test(service)) return `Пополнение баланса ${balance}`;
  const amountLine = message.match(/(Количество золота|Количество монет|Сумма пополнения)\s*:\s*([^\n]+)/i);
  if (amountLine?.[2]) return `${amountLine[1]} ${amountLine[2].trim()}`;
  return "не указан";
}

function extractOrderCode(message: string) {
  return message.match(/\bECL-[A-Z0-9]+(?:-[A-Z0-9]+){2,}\b/i)?.[0] || "";
}

async function sendOrderInstructions(chatId: number, orderMessage: string, businessConnectionId?: string) {
  const category = extractOrderCategory(orderMessage);
  const response = await telegram("sendMessage", {
    chat_id: chatId,
    ...(businessConnectionId ? { business_connection_id: businessConnectionId } : {}),
    parse_mode: "HTML",
    text: [
      "<b>Добро пожаловать в Ecliptic Store!</b>",
      "",
      `<b>${category.label}: ${escapeHtml(category.value)}</b>`,
      `<b>Товар: ${escapeHtml(extractOrderProduct(orderMessage))}</b>`,
      "",
      "<b>Реквизиты для оплаты переводилкой:</b>",
      "<b>Номер получателя: <code>77534682</code></b>",
      "<b>Получатель: Владислав Б</b>",
      `<b>Сумма к оплате: ${escapeHtml(extractOrderAmount(orderMessage))}</b>`,
      "",
      "<b>После оплаты отправьте сюда скриншот операции.</b>",
    ].join("\n"),
  });
  return Boolean(response);
}

async function notifyManagerAboutPayment(message: TelegramMessage, pending: PendingTelegramOrder) {
  const managerChatId = await getManagerChatId();
  const customerChatId = Number(message.chat?.id);
  if (!managerChatId || !Number.isFinite(customerChatId)) return false;

  const sender = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ") || "не указано";
  const username = message.from?.username ? `@${message.from.username}` : "не указан";
  const category = extractOrderCategory(pending.orderMessage);
  const managerText = [
    "💳 <b>Клиент отправил скриншот оплаты</b>",
    "",
    `Клиент: <b>${escapeHtml(sender)}</b>`,
    `Telegram: <b>${escapeHtml(username)}</b>`,
    `Chat ID: <code>${customerChatId}</code>`,
    `${category.label}: <b>${escapeHtml(category.value)}</b>`,
    `Товар: <b>${escapeHtml(extractOrderProduct(pending.orderMessage))}</b>`,
    `Сумма: <b>${escapeHtml(pending.amount)}</b>`,
  ].join("\n");
  const callbackBase = [String(customerChatId), pending.businessConnectionId || ""].filter(Boolean).join(":");
  const replyMarkup = {
    inline_keyboard: [[
      { text: "✅ Подтвердить оплату", callback_data: `pay:approve:${callbackBase}` },
      { text: "❌ Отклонить", callback_data: `pay:reject:${callbackBase}` },
    ]],
  };

  if (message.photo?.length) {
    const largest = message.photo[message.photo.length - 1];
    return Boolean(await telegram("sendPhoto", {
      chat_id: managerChatId,
      photo: largest.file_id,
      caption: managerText,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    }));
  }

  if (message.document?.file_id) {
    return Boolean(await telegram("sendDocument", {
      chat_id: managerChatId,
      document: message.document.file_id,
      caption: managerText,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    }));
  }

  return false;
}

async function handleDecision(update: TelegramUpdate) {
  const callback = update.callback_query;
  const data = callback?.data || "";
  const managerChatId = await getManagerChatId();
  const callbackChatId = String(callback?.message?.chat?.id || "");
  if (!callback || callbackChatId !== String(managerChatId)) return false;

  const match = data.match(/^pay:(approve|reject):(-?\d+)(?::([A-Za-z0-9_-]+))?$/);
  if (!match) return false;
  const [, decision, customerChatId, businessConnectionId] = match;
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
    ...(businessConnectionId ? { business_connection_id: businessConnectionId } : {}),
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
  if (update.business_connection?.is_enabled && update.business_connection.user_chat_id) {
    await rememberBusinessManagerChat(update.business_connection.user_chat_id).catch(() => undefined);
  }
  if (await handleDecision(update)) return NextResponse.json({ ok: true, decision: true });

  const message = update.business_message || update.message;
  if (!message?.chat?.id) return NextResponse.json({ ok: true, ignored: true });
  if (isOutgoingBusinessMessage(message)) {
    return NextResponse.json({ ok: true, ignored: "outgoing" });
  }
  if (message.business_connection_id) {
    const connection = await refreshBusinessConnection(message.business_connection_id).catch(() => undefined);
    if (connection?.user_chat_id) {
      await rememberBusinessManagerChat(connection.user_chat_id).catch(() => undefined);
    }
  }
  await rememberManagerChat(message.from?.username, message.chat.id).catch(() => undefined);
  if (message.text?.trim() && !message.photo?.length && !message.document?.file_id) {
    const orderCode = extractOrderCode(message.text);
    if (!orderCode) return NextResponse.json({ ok: true, ignored: "not-an-order" });
    const replied = await sendOrderInstructions(message.chat.id, message.text, message.business_connection_id);
    if (replied) {
      await savePendingTelegramOrder({
        chatId: message.chat.id,
        businessConnectionId: message.business_connection_id,
        orderCode,
        amount: extractOrderAmount(message.text),
        orderMessage: message.text,
        createdAt: new Date().toISOString(),
      });
    }
    return NextResponse.json({ ok: true, replied, awaitingPayment: replied });
  }

  if (message.photo?.length || message.document?.file_id) {
    const pending = await getPendingTelegramOrder(message.chat.id);
    if (!pending) return NextResponse.json({ ok: true, ignored: "no-pending-order" });
    const notified = await notifyManagerAboutPayment(message, pending);
    return NextResponse.json({ ok: true, paymentScreenshot: true, notified });
  }

  return NextResponse.json({ ok: true, ignored: "not-an-order" });
}
