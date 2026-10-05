import { NextResponse } from "next/server";
import {
  clearFallbackAnalyticsEvents,
  readFallbackAnalyticsEvents,
  summarizeAnalyticsEvents,
} from "../../../../lib/analyticsFallbackStore";
import { getRedisConfig, redisPipeline, validateAdminRequest } from "../../../../lib/security";

export const runtime = "nodejs";

const ANALYTICS_KEY = "ecliptic:analytics:v2:events";
const ANALYTICS_TOTALS_KEY = "ecliptic:analytics:v2:totals";
const ANALYTICS_ACTIONS_KEY = "ecliptic:analytics:v2:actions";
const ANALYTICS_PRODUCTS_KEY = "ecliptic:analytics:v2:products";
const LEGACY_ANALYTICS_KEYS = [
  "ecliptic:analytics:events",
  "ecliptic:analytics:totals",
  "ecliptic:analytics:actions",
  "ecliptic:analytics:products",
];
const DEFAULT_EVENTS_LIMIT = 1000;
const MAX_EVENTS_LIMIT = 5000;

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
  let redisError = "";
  const offset = Math.max(0, Math.floor(Number(body.offset || 0)));
  const limit = Math.min(MAX_EVENTS_LIMIT, Math.max(1, Math.floor(Number(body.limit || DEFAULT_EVENTS_LIMIT))));
  const end = offset + limit - 1;

  try {
    if (body.reset) {
      await redisPipeline(
        [["DEL", ANALYTICS_KEY, ANALYTICS_TOTALS_KEY, ANALYTICS_ACTIONS_KEY, ANALYTICS_PRODUCTS_KEY, ...LEGACY_ANALYTICS_KEYS]],
        { timeoutMs: 3000 }
      ).catch(() => null);
      await clearFallbackAnalyticsEvents();
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
    ], { timeoutMs: 3000 });
  } catch (error) {
    redisError = error instanceof Error ? error.message : "Redis request failed";
    result = null;
  }

  if (!result) {
    const allEvents = (await readFallbackAnalyticsEvents()).filter((event) => event.type !== "page_view");
    const events = allEvents.slice(offset, offset + limit);
    return NextResponse.json({
      ok: true,
      configured: Boolean(getRedisConfig()),
      fallback: true,
      ...(redisError ? { redisError } : {}),
      events,
      pagination: {
        offset,
        limit,
        loaded: events.length,
        totalStored: allEvents.length,
        hasMore: offset + events.length < allEvents.length,
        nextOffset: offset + events.length,
      },
      summary: summarizeAnalyticsEvents(allEvents),
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
        .filter((event) => event && event.type !== "page_view")
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
      total: events.length,
      views: events.filter((event) => event.type === "product_open").length,
      buys: totals.buys || events.filter((event) => event.type === "buy_click").length,
      telegram: totals.telegram || events.filter((event) => String(event.type || "").includes("telegram")).length,
      actions: undefined,
      products: undefined,
    },
  });
}
