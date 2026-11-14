let checkedAt = 0;
let registration: Promise<void> | null = null;

export async function ensurePrimaryTelegramWebhook(request: Request, botToken: string) {
  const now = Date.now();
  if (!botToken || now - checkedAt < 10 * 60 * 1000) return;
  if (registration) return registration;

  registration = (async () => {
    const body: Record<string, unknown> = {
      url: new URL("/api/telegram/webhook", request.url).toString(),
      allowed_updates: ["message", "business_message", "business_connection", "callback_query"],
      drop_pending_updates: false,
    };
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
    if (secret) body.secret_token = secret;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      checkedAt = 0;
      return;
    }

    const result = await response.json().catch(() => null) as { ok?: boolean } | null;
    checkedAt = result?.ok ? Date.now() : 0;
  })()
    .catch(() => {
      checkedAt = 0;
    })
    .finally(() => {
      registration = null;
    });

  return registration;
}
