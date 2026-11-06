import type { CustomerOrder, CustomerUser } from "./customerAuth";

function dispatcherUrl() {
  return (process.env.STARS_DISPATCHER_URL || "").replace(/\/$/, "");
}

function dispatcherSecret() {
  return process.env.STARS_DISPATCHER_SECRET || "";
}

function extractAmount(value: string) {
  const match = value.match(/(?:^|\D)(\d{1,6})(?:\D|$)/);
  return match ? Number(match[1]) : 0;
}

export function isStarsDispatcherConfigured() {
  return Boolean(dispatcherUrl() && dispatcherSecret());
}

export async function enqueueStarsOrder(order: CustomerOrder, user: CustomerUser) {
  const baseUrl = dispatcherUrl();
  const secret = dispatcherSecret();
  if (!baseUrl || !secret) return { configured: false, ok: false };

  const username = (order.recipientUsername || user.username || "").replace(/^@/, "").trim();
  const amount = extractAmount(order.offer);
  if (!/^[A-Za-z0-9_]{5,32}$/.test(username) || !Number.isInteger(amount) || amount < 1) {
    return { configured: true, ok: false, skipped: true };
  }

  const response = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-dispatcher-secret": secret,
    },
    body: JSON.stringify({
      clientOrderId: order.clientOrderId || order.id,
      siteOrderId: order.id,
      username,
      amount,
      priceRub: order.priceRub,
      offer: order.offer,
    }),
    cache: "no-store",
  });

  return { configured: true, ok: response.ok, status: response.status };
}
