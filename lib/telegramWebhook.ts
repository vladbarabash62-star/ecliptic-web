let checkedAt = 0;

export async function ensurePrimaryTelegramWebhook(request: Request, botToken: string) {
  const now = Date.now();
  if (!botToken || now - checkedAt < 10 * 60 * 1000) return;
  checkedAt = now;

  const body: Record<string, unknown> = {
    url: new URL("/api/telegram/webhook", request.url).toString(),
    allowed_updates: ["message", "business_message", "business_connection", "callback_query"],
  };
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  if (secret) body.secret_token = secret;

  await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}
