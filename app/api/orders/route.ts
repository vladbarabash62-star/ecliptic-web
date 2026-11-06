import { NextResponse } from "next/server";
import { addCustomerOrder, getCustomerOrders, getCustomerUserFromCookies } from "../../../lib/customerAuth";
import { notifyStarsOrder } from "../../../lib/starsBot";

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
  const order = await addCustomerOrder(user, body);
  if (order?.productSlug === "telegram-stars") {
    await notifyStarsOrder(order, user).catch(() => undefined);
  }
  return NextResponse.json({ ok: true, stored: Boolean(order), order });
}
