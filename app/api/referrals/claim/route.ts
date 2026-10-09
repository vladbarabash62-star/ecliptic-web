import { NextResponse } from "next/server";
import {
  createCustomerReferralClaim,
  getCustomerUserFromCookies,
  markCustomerReferralClaimSent,
  REFERRAL_CLAIM_COOLDOWN_MS,
} from "../../../../lib/customerAuth";
import { getManagerChatId } from "../../../../lib/telegramManagerStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function botToken() {
  return process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_WEBAPP_BOT_TOKEN || "";
}

async function sendManagerNotification(text: string) {
  const token = botToken();
  if (!token) return false;
  const chatId = await getManagerChatId();
  if (!chatId) return false;

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatRetryAfter(ms: number) {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
  if (totalMinutes >= 30) return "30 минут";
  if (totalMinutes === 1) return "1 минуту";
  if (totalMinutes >= 2 && totalMinutes <= 4) return `${totalMinutes} минуты`;
  return `${totalMinutes} минут`;
}

export async function POST() {
  const user = await getCustomerUserFromCookies();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Войдите в аккаунт через Telegram." }, { status: 401 });
  }

  const result = await createCustomerReferralClaim(user.id, "pending_manager");
  const claim = result.claim;

  if (result.duplicate) {
    const retryAfterMs = Math.max(0, result.retryAfterMs || REFERRAL_CLAIM_COOLDOWN_MS);
    return NextResponse.json(
      {
        ok: false,
        duplicate: true,
        retryAfterMs,
        claim,
        error: `Повторную заявку можно отправить через ${formatRetryAfter(retryAfterMs)}.`,
      },
      { status: 429 }
    );
  }

  const managerSent = await sendManagerNotification(
    [
      "🎁 <b>Реферальная программа</b>",
      "",
      `Пользователь выполнил условия и просит подарок до <b>25 Telegram Stars</b>.`,
      `Имя: <b>${escapeHtml(user.name || "не указано")}</b>`,
      `Telegram: <b>${escapeHtml(user.username || "не указан")}</b>`,
      `Приглашено друзей: <b>${result.invitedCount}</b>`,
      `Заявка: <code>${escapeHtml(claim.id)}</code>`,
      `ID сайта: <code>${escapeHtml(user.id)}</code>`,
    ].join("\n")
  );

  const finalClaim = managerSent ? await markCustomerReferralClaimSent(claim.id) : claim;

  return NextResponse.json({
    ok: true,
    sent: managerSent,
    duplicate: result.duplicate,
    claim: finalClaim || claim,
    message: "Заявка сохранена. В ближайшее время менеджер проверит условия и отправит подарок.",
  });
}
