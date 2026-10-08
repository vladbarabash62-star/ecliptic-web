import { NextResponse } from "next/server";
import { createCustomerReferralClaim, getCustomerUserFromCookies } from "../../../../lib/customerAuth";
import { getManagerChatId } from "../../../../lib/telegramManagerStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function botToken() {
  return process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_WEBAPP_BOT_TOKEN || "";
}

async function sendManagerNotification(text: string) {
  const token = botToken();
  if (!token) return false;

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: await getManagerChatId(),
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  }).catch(() => null);

  return Boolean(response?.ok);
}

export async function POST() {
  const user = await getCustomerUserFromCookies();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Войдите в аккаунт через Telegram." }, { status: 401 });
  }

  const managerSent = await sendManagerNotification(
    [
      "🎁 <b>Реферальная программа</b>",
      "",
      `Пользователь выполнил условия и просит подарок до <b>25 Telegram Stars</b>.`,
      `Имя: <b>${user.name || "не указано"}</b>`,
      `Telegram: <b>${user.username || "не указан"}</b>`,
      `ID сайта: <code>${user.id}</code>`,
    ].join("\n")
  );

  const result = await createCustomerReferralClaim(user.id, managerSent ? "sent" : "pending_manager");

  return NextResponse.json({
    ok: true,
    sent: managerSent,
    duplicate: result.duplicate,
    claim: result.claim,
    message: managerSent
      ? "Заявка отправлена менеджеру."
      : "Заявка сохранена. Если сообщение в Telegram не пришло, напишите менеджеру @Ecliptic_Store_PMR.",
  });
}
