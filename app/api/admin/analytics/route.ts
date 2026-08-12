import { NextResponse } from "next/server";
import { getRedisConfig, redisPipeline, validateAdminRequest } from "../../../../lib/security";

export const runtime = "nodejs";

const ANALYTICS_KEY = "ecliptic:analytics:events";
const ANALYTICS_TOTALS_KEY = "ecliptic:analytics:totals";
const ANALYTICS_ACTIONS_KEY = "ecliptic:analytics:actions";
const ANALYTICS_PRODUCTS_KEY = "ecliptic:analytics:products";

function hashArrayToObject(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, Number(item || 0)])
    );
  }

  if (!Array.isArray(value)) return {};

  const result: Record<string, number> = {};
  for (let index = 0; index < value.length; index += 2) {
    const key = String(value[index] || "");
    if (!key) continue;
    result[key] = Number(value[index + 1] || 0);
  }

  return result;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { pin?: string; reset?: boolean };
  const authError = await validateAdminRequest(request, body.pin);
  if (authError) return authError;

  let result = null;

  try {
    if (body.reset) {
      await redisPipeline([["DEL", ANALYTICS_KEY, ANALYTICS_TOTALS_KEY, ANALYTICS_ACTIONS_KEY, ANALYTICS_PRODUCTS_KEY]], { timeoutMs: 2500 });
      return NextResponse.json({
        ok: true,
        configured: Boolean(getRedisConfig()),
        reset: true,
        events: [],
        summary: {
          total: 0,
          views: 0,
          buys: 0,
          telegram: 0,
          actions: {},
          products: {},
        },
      });
    }

    result = await redisPipeline([
      ["LRANGE", ANALYTICS_KEY, "0", "1999"],
      ["HGETALL", ANALYTICS_TOTALS_KEY],
      ["HGETALL", ANALYTICS_ACTIONS_KEY],
      ["HGETALL", ANALYTICS_PRODUCTS_KEY],
    ], { timeoutMs: 5000 });
  } catch {
    return NextResponse.json({
      ok: true,
      configured: Boolean(getRedisConfig()),
      events: [],
      error: "Redis unavailable",
    });
  }
  const rawEvents = result?.[0]?.result || [];
  const totals = hashArrayToObject(result?.[1]?.result);
  const actions = hashArrayToObject(result?.[2]?.result);
  const products = hashArrayToObject(result?.[3]?.result);
  const events = Array.isArray(rawEvents)
    ? rawEvents
        .map((item) => {
          try {
            return JSON.parse(item);
          } catch {
            return null;
          }
        })
        .filter(Boolean)
    : [];

  return NextResponse.json({
    ok: true,
    configured: Boolean(getRedisConfig()),
    events,
    summary: {
      total: totals.total || events.length,
      views: totals.views || events.filter((event) => event.type === "page_view").length,
      buys: totals.buys || events.filter((event) => event.type === "buy_click").length,
      telegram: totals.telegram || events.filter((event) => String(event.type || "").includes("telegram")).length,
      actions: Object.keys(actions).length ? actions : undefined,
      products: Object.keys(products).length ? products : undefined,
    },
  });
}
