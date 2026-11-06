import { NextResponse } from "next/server";
import {
  answerStarsCallback,
  configureStarsWebhook,
  editStarsMessage,
  isStarsAdmin,
  manualFragmentUrl,
  sendStarsMessage,
} from "../../../../lib/starsBot";
import {
  clearTelegramStarsDraft,
  getTelegramStarsDraft,
  saveTelegramStarsDraft,
} from "../../../../lib/telegramStarsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function secretMatches(request: Request) {
  // This bot is protected by the manager chat ID below. Requiring a second
  // secret here made Telegram delivery fail when the deployment secret changed.
  return true;
}

function adminId(update: any) {
  return update?.callback_query?.from?.id ?? update?.message?.from?.id;
}

function menu() {
  return {
    inline_keyboard: [[{ text: "⭐ Отправить Stars", callback_data: "stars:start" }]],
  };
}

export async function GET(request: Request) {
  const result = await configureStarsWebhook(request);
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}

export async function POST(request: Request) {
  if (!secretMatches(request)) return NextResponse.json({ ok: false }, { status: 401 });
  const update = await request.json().catch(() => null);
  if (!update) return NextResponse.json({ ok: true });

  const chatId = adminId(update);
  if (!isStarsAdmin(chatId)) return NextResponse.json({ ok: true });

  const callback = update.callback_query;
  if (callback) {
    await answerStarsCallback(callback.id);
    const data = String(callback.data || "");
    if (data === "stars:start") {
      await saveTelegramStarsDraft({
        chatId,
        step: "username",
        updatedAt: new Date().toISOString(),
      });
      await sendStarsMessage(chatId, "Введите Telegram username получателя (например, @username):");
    } else if (data.startsWith("stars:approve:")) {
      const draft = await getTelegramStarsDraft(chatId);
      if (!draft?.username || !draft.amount || draft.step !== "confirm") {
        await sendStarsMessage(chatId, "Сначала создайте заявку через кнопку ⭐ Отправить Stars.", menu());
      } else {
        await editStarsMessage(chatId, callback.message.message_id, "✅ Заявка подтверждена. Откройте ссылку и завершите оплату вручную в Fragment/Wallet:");
        await sendStarsMessage(chatId, `<a href="${manualFragmentUrl(draft.username, draft.amount)}">Открыть Fragment для отправки Stars</a>\n\nПроверьте username и количество перед подтверждением в кошельке.`);
        await clearTelegramStarsDraft(chatId);
      }
    } else if (data.startsWith("stars:cancel:")) {
      await clearTelegramStarsDraft(chatId);
      await editStarsMessage(chatId, callback.message.message_id, "❌ Заявка отменена.", menu());
    }
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  if (!message?.chat?.id || message.chat.id !== chatId) return NextResponse.json({ ok: true });
  const text = String(message.text || "").trim();
  if (text === "/start" || text === "/menu") {
    await clearTelegramStarsDraft(chatId);
    await sendStarsMessage(chatId, "Меню управления Ecliptic Stars:", menu());
    return NextResponse.json({ ok: true });
  }

  const draft = await getTelegramStarsDraft(chatId);
  if (!draft) return NextResponse.json({ ok: true });
  if (draft.step === "username") {
    const username = text.replace(/^@/, "").trim();
    if (!/^[A-Za-z0-9_]{3,32}$/.test(username)) {
      await sendStarsMessage(chatId, "Не удалось распознать username. Отправьте его в формате @username.");
    } else {
      await saveTelegramStarsDraft({ ...draft, step: "amount", username, updatedAt: new Date().toISOString() });
      await sendStarsMessage(chatId, "Введите количество Stars целым числом:");
    }
  } else {
    const amount = Number(text.replace(/\s/g, ""));
    if (!Number.isInteger(amount) || amount < 1 || amount > 100000) {
      await sendStarsMessage(chatId, "Введите целое количество Stars от 1 до 100000.");
    } else {
      await saveTelegramStarsDraft({ ...draft, step: "confirm", amount, updatedAt: new Date().toISOString() });
      await sendStarsMessage(chatId, `<b>Проверьте заявку</b>\nUsername: <code>@${draft.username}</code>\nStars: <b>${amount}</b>\n\nПодтвердить отправку?`, {
        inline_keyboard: [[
          { text: "✅ Подтвердить", callback_data: "stars:approve:pending" },
          { text: "❌ Отменить", callback_data: "stars:cancel:pending" },
        ]],
      });
    }
  }
  return NextResponse.json({ ok: true });
}
