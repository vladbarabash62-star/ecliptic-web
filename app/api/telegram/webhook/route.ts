import { NextResponse } from "next/server";
import {
  getPendingCustomerReferralClaims,
  markCustomerReferralRewarded,
  markCustomerReferralClaimSent,
} from "../../../../lib/customerAuth";
import { rememberManagerChat } from "../../../../lib/telegramManagerStore";
import { savePendingTelegramLogin } from "../../../../lib/telegramLoginStore";
import { createPendingTelegramLogin } from "../../../../lib/telegramLoginStore";
import {
  beginTelegramAccountNoticeEdit,
  saveTelegramAccountNoticeTemplate,
  saveTelegramCustomEmojiIds,
} from "../../../../lib/telegramCustomEmojiStore";
import { processTelegramPaymentUpdate } from "../payment-webhook/route";
import { ensurePrimaryTelegramWebhook } from "../../../../lib/telegramWebhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function typingDelay(text: string) {
  return Math.min(5000, Math.max(1800, 1200 + text.length * 18));
}

async function showTyping(chatId: number, token: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  }).catch(() => undefined);
  await sleep(typingDelay(text));
}

type TelegramUpdate = {
  callback_query?: {
    id?: string;
    data?: string;
    from?: { id?: number; username?: string };
    message?: { chat?: { id?: number }; message_id?: number };
  };
  message?: {
    text?: string;
    entities?: Array<{ type?: string; offset?: number; length?: number; custom_emoji_id?: string }>;
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
  business_connection?: {
    id?: string;
    user_chat_id?: number;
    is_enabled?: boolean;
  };
  business_message?: {
    chat?: { id?: number };
    from?: { id?: number; is_bot?: boolean; username?: string; first_name?: string; last_name?: string };
    sender_business_bot?: { id?: number; username?: string };
    business_connection_id?: string;
    media_group_id?: string;
    text?: string;
    caption?: string;
    photo?: Array<{ file_id: string; width?: number; height?: number }>;
    document?: { file_id: string; mime_type?: string; file_name?: string };
  };
};

function botToken() {
  return process.env.TELEGRAM_LOGIN_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_WEBAPP_BOT_TOKEN || "";
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
  const text = [
    "Здравствуйте! Добро пожаловать в Ecliptic Store.",
    "",
    "У нас можно посмотреть цифровые товары, игровые пополнения, подписки и Telegram Stars. Ассортимент и актуальные цены доступны на сайте:",
    "https://ecliptic.website",
  ].join("\n");
  await showTyping(chatId, token, text);
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

async function sendPlainTelegramMessage(chatId: number, text: string, token: string, replyMarkup?: Record<string, unknown>) {
  await showTyping(chatId, token, text);
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  }).catch(() => null);

  return Boolean(response?.ok);
}

async function answerCallback(callbackId: string, token: string) {
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId }),
  }).catch(() => undefined);
}

async function sendManagerMenu(chatId: number, token: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: "Меню управления Ecliptic Store\\n\\nВыберите, что хотите изменить:",
      reply_markup: { inline_keyboard: [[{ text: "Telegram аккаунт", callback_data: "edit_account_notice" }]] },
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
      "Пользователь выполнил условия: 5 приглашённых друзей и хотя бы один заказ. Просит подарок до <b>50 Telegram Stars</b>.",
      `Имя: <b>${escapeHtml(item.user?.name || "не указано")}</b>`,
      `Telegram: <b>${escapeHtml(item.user?.username || "не указан")}</b>`,
      `Приглашено участников: <b>${item.claim.invitedCount}</b>`,
      `Заявка: <code>${escapeHtml(item.claim.id)}</code>`,
      `ID сайта: <code>${escapeHtml(item.user?.id || item.claim.userId)}</code>`,
    ].join("\n");

    const sent = await sendPlainTelegramMessage(chatId, text, token, {
      inline_keyboard: [[{ text: "Подарок выдан", callback_data: `referral_reward:${item.claim.userId}` }]],
    });
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
  await ensurePrimaryTelegramWebhook(request, token);

  const update = await request.json().catch(() => ({})) as TelegramUpdate;
  if (update.business_connection || update.business_message || update.callback_query?.data?.startsWith("pay:")) {
    return processTelegramPaymentUpdate(update as never, request);
  }
  const callback = update.callback_query;
  if (callback?.id) {
    await answerCallback(callback.id, token);
    if (callback.data?.startsWith("referral_reward:") && callback.message?.chat?.id) {
      const manager = String(callback.from?.username || "").replace(/^@/, "").toLowerCase() === "ecliptic_store_pmr";
      if (manager) {
        const userId = callback.data.slice("referral_reward:".length);
        await sendPlainTelegramMessage(
          callback.message.chat.id,
          "Вы уверены, что хотите подтвердить выдачу подарка на 50 Telegram Stars?",
          token,
          {
            inline_keyboard: [[
              { text: "Да, подтвердить", callback_data: `referral_confirm:${userId}` },
              { text: "Отмена", callback_data: `referral_cancel:${userId}` },
            ]],
          },
        );
        if (callback.message.message_id) {
          await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: callback.message.chat.id,
              message_id: callback.message.message_id,
              reply_markup: { inline_keyboard: [] },
            }),
          }).catch(() => undefined);
        }
      }
      return NextResponse.json({ ok: true, referralReward: manager, confirmationRequested: manager });
    }
    if (callback.data?.startsWith("referral_confirm:") && callback.message?.chat?.id) {
      const manager = String(callback.from?.username || "").replace(/^@/, "").toLowerCase() === "ecliptic_store_pmr";
      if (manager) {
        const userId = callback.data.slice("referral_confirm:".length);
        await markCustomerReferralRewarded(userId);
        if (callback.message.message_id) {
          await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: callback.message.chat.id,
              message_id: callback.message.message_id,
              reply_markup: { inline_keyboard: [] },
            }),
          }).catch(() => undefined);
        }
        await sendPlainTelegramMessage(callback.message.chat.id, "✅ Подарок подтверждён и отмечен выданным. Статус на сайте обновлён. Отправьте 50 Stars получателю вручную через Telegram.", token);
      }
      return NextResponse.json({ ok: true, referralConfirmation: manager });
    }
    if (callback.data?.startsWith("referral_cancel:") && callback.message?.chat?.id) {
      const manager = String(callback.from?.username || "").replace(/^@/, "").toLowerCase() === "ecliptic_store_pmr";
      if (manager) {
        if (callback.message.message_id) {
          await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: callback.message.chat.id,
              message_id: callback.message.message_id,
              reply_markup: { inline_keyboard: [] },
            }),
          }).catch(() => undefined);
        }
        await sendPlainTelegramMessage(callback.message.chat.id, "Отмена. Статус подарка не изменён.", token);
      }
      return NextResponse.json({ ok: true, referralCancellation: manager });
    }
    if (callback.data === "edit_account_notice" && callback.message?.chat?.id) {
      const manager = String(callback.from?.username || "").replace(/^@/, "").toLowerCase() === "ecliptic_store_pmr";
      if (manager) {
        await beginTelegramAccountNoticeEdit(callback.message.chat.id);
        await sendPlainTelegramMessage(callback.message.chat.id, "Отправьте следующим сообщением текст автоответа для Telegram-аккаунта. Эмодзи и premium emoji сохранятся.", token);
      }
    }
    return NextResponse.json({ ok: true, callback: true });
  }
  const message = update.message;
  const text = message?.text || "";

  // Keep the exact premium emoji used in the account-safety notice. Only the
  // known notice is accepted, so ordinary customer messages cannot overwrite it.
  if (/Важно!\s*Ознакомьтесь перед использованием аккаунта/i.test(text)) {
    const ids = (message?.entities || [])
      .filter((entity) => entity.type === "custom_emoji" && entity.custom_emoji_id)
      .map((entity) => String(entity.custom_emoji_id));
    if (ids.length) await saveTelegramCustomEmojiIds(ids);
  }
  const managerChat = Number(message?.chat?.id);
  const managerUsername = String(message?.from?.username || "").replace(/^@/, "").toLowerCase();
  const managerRemembered = await rememberManagerChat(message?.from?.username, message?.chat?.id);
  if (managerUsername === "ecliptic_store_pmr" && Number.isFinite(managerChat)) {
    if (/^\/start(?:\s|$)/i.test(text)) {
      await flushPendingReferralClaims(managerChat, token);
      await sendManagerMenu(managerChat, token);
      return NextResponse.json({ ok: true, managerMenu: true });
    }
    const saved = await saveTelegramAccountNoticeTemplate(
      managerChat,
      text,
      (message?.entities || []).filter((entity) => entity.type && Number.isFinite(entity.offset) && Number.isFinite(entity.length)).map((entity) => ({
        type: entity.type as string,
        offset: Number(entity.offset),
        length: Number(entity.length),
        ...(entity.custom_emoji_id ? { custom_emoji_id: entity.custom_emoji_id } : {}),
      }))
    );
    if (saved) {
      await sendPlainTelegramMessage(managerChat, "Текст для Telegram-аккаунта сохранён.", token);
      return NextResponse.json({ ok: true, managerTemplate: true });
    }
  }
  const loginToken = text.match(/^\/start\s+login_([a-f0-9-]{20,80})/i)?.[1];

  if (managerRemembered && message?.chat?.id) {
    await flushPendingReferralClaims(message.chat.id, token);
  }

  if (!loginToken && /^\/start(?:\s|$)/i.test(text) && message?.chat?.id) {
    if (message.from?.id) {
      const freshLoginToken = await createPendingTelegramLogin();
      const saved = await savePendingTelegramLogin(freshLoginToken, message.from);
      if (saved) {
        await sendTelegramMessage(
          message.chat.id,
          "Готово. Нажмите кнопку ниже, чтобы войти в личный кабинет Ecliptic Store.",
          token,
          freshLoginToken
        );
        return NextResponse.json({ ok: true, loginPrompt: true });
      }
    }
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
