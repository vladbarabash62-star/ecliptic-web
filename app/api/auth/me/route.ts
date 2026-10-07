import { NextResponse } from "next/server";
import { getCustomerOrders, getCustomerUserFromCookies } from "../../../../lib/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCustomerUserFromCookies();
  if (!user) return NextResponse.json({ ok: true, user: null, orders: [] });

  const orders = await getCustomerOrders(user.id);
  return NextResponse.json({ ok: true, user, orders });
}
