import { NextResponse } from "next/server";
import { addCustomerOrder, getCustomerOrders, getCustomerUserFromCookies } from "../../../lib/customerAuth";
import { notifyStarsOrder } from "../../../lib/starsBot";
import { enqueueStarsOrder, isStarsDispatcherConfigured } from "../../../lib/starsDispatcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCustomerUserFromCookies();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized", orders: [] }, { status: 401 });

  const orders = await getCustomerOrders(user.id);
  return NextResponse.json({ ok: true, orders });
}

export async function POST(request: Request) {
  const user = await getCustomerUserFromCookies();
  if (!user) return NextResponse.json({ ok: false, stored: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const clientOrderId = typeof body?.clientOrderId === "string" ? body.clientOrderId.trim() : "";
  const existingOrders = clientOrderId ? await getCustomerOrders(user.id) : [];
  const alreadyStored = Boolean(clientOrderId && existingOrders.some((item) => item.clientOrderId === clientOrderId));
  const order = await addCustomerOrder(user, body);
  if (order?.productSlug === "telegram-stars" && !alreadyStored) {
    if (isStarsDispatcherConfigured()) {
      await enqueueStarsOrder(order, user).catch(() => undefined);
    } else {
      await notifyStarsOrder(order, user).catch(() => undefined);
    }
  }
  return NextResponse.json({ ok: true, stored: Boolean(order), order });
}
