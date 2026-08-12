import { NextResponse } from "next/server";
import { getRedisConfig, redisPipeline, validateAdminRequest } from "../../../../lib/security";

export const runtime = "nodejs";

const ANALYTICS_KEY = "ecliptic:analytics:events";
const ANALYTICS_TOTALS_KEY = "ecliptic:analytics:totals";
const ANALYTICS_ACTIONS_KEY = "ecliptic:analytics:actions";
const ANALYTICS_PRODUCTS_KEY = "ecliptic:analytics:products";
const DEFAULT_EVENTS_LIMIT = 200;
const MAX_EVENTS_LIMIT = 1000;

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
  const body = (await request.json().catch(() => ({}))) as { pin?: string; reset?: boolean; offset?: number; limit?: number };
  const authError = await validateAdminRequest(request, body.pin);
  if (authError) return authError;

  let result = null;
  const offset = Math.max(0, Math.floor(Number(body.offset || 0)));
  const limit = Math.min(MAX_EVENTS_LIMIT, Math.max(1, Math.floor(Number(body.limit || DEFAULT_EVENTS_LIMIT))));
  const end = offset + limit - 1;

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
      ["LRANGE", ANALYTICS_KEY, String(offset), String(end)],
      ["LLEN", ANALYTICS_KEY],
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
  const storedEvents = Number(result?.[1]?.result || 0);
  const totals = hashArrayToObject(result?.[2]?.result);
  const actions = hashArrayToObject(result?.[3]?.result);
  const products = hashArrayToObject(result?.[4]?.result);
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
    pagination: {
      offset,
      limit,
      loaded: events.length,
      totalStored: storedEvents,
      hasMore: offset + events.length < storedEvents,
      nextOffset: offset + events.length,
    },
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
