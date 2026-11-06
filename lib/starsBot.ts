import type { CustomerOrder, CustomerUser } from "./customerAuth";

const TELEGRAM_API = "https://api.telegram.org";

function token() {
  return process.env.STARS_BOT_TOKEN || "";
}

export function starsAdminChatId() {
  return process.env.STARS_ADMIN_CHAT_ID || process.env.ADMIN_CHAT_ID || "7405904325";
}

export function isStarsAdmin(chatId: number | string) {
  return String(chatId) === String(starsAdminChatId());
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function callTelegram(method: string, body: Record<string, unknown>) {
  const botToken = token();
  if (!botToken) return { ok: false, description: "STARS_BOT_TOKEN is not configured" };

  const response = await fetch(`${TELEGRAM_API}/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return await response.json().catch(() => ({ ok: false, description: "Invalid Telegram response" }));
}

export async function sendStarsMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: Record<string, unknown>,
) {
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function answerStarsCallback(callbackQueryId: string, text?: string) {
  return callTelegram("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text, show_alert: false } : {}),
  });
}

export async function editStarsMessage(
  chatId: number | string,
  messageId: number,
  text: string,
  replyMarkup?: Record<string, unknown>,
) {
  return callTelegram("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : { reply_markup: { inline_keyboard: [] } }),
  });
}

export async function configureStarsWebhook(request: Request) {
  const botToken = token();
  if (!botToken) return { ok: false, configured: false, description: "STARS_BOT_TOKEN is not configured" };

  const url = new URL("/api/stars/webhook", request.url).toString();
  const secret = process.env.STARS_TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET || "";
  const result = await callTelegram("setWebhook", {
    url,
    allowed_updates: ["message", "callback_query"],
    ...(secret ? { secret_token: secret } : {}),
  });
  return { ok: Boolean(result.ok), configured: Boolean(result.ok), description: result.description || "" };
}

export function starsOrderNotification(order: CustomerOrder, user: CustomerUser) {
  const username = user.username ? `@${user.username.replace(/^@/, "")}` : user.name || "не указан";
  const amount = order.offer || "Количество не указано";
  return [
    "<b>📦 Новый заказ Stars</b>",
    `Юзер: ${escapeHtml(username)}`,
    `Количество звезд: <b>${escapeHtml(amount)}</b>`,
    `Сумма на сайте: <b>${escapeHtml(order.priceRub ?? "не указана")} ₽</b>`,
    `ID заказа: <code>${escapeHtml(order.id)}</code>`,
    "",
    "Что делаем?",
  ].join("\n");
}

export async function notifyStarsOrder(order: CustomerOrder, user: CustomerUser) {
  return sendStarsMessage(starsAdminChatId(), starsOrderNotification(order, user), {
    inline_keyboard: [[
      { text: "✅ Подтвердить отправку", callback_data: `stars:approve:${order.id}` },
      { text: "❌ Отменить", callback_data: `stars:cancel:${order.id}` },
    ]],
  });
}

export function manualFragmentUrl(username: string, amount: number) {
  const cleanUsername = username.replace(/^@/, "").trim();
  return `https://fragment.com/username/${encodeURIComponent(cleanUsername)}?stars=${encodeURIComponent(String(amount))}`;
}
