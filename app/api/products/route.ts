import { NextResponse } from "next/server";
import { getProducts } from "../../../lib/productStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const products = await getProducts();
  return NextResponse.json({ ok: true, products });
}
