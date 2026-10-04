import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { addFallbackAnalyticsEvent } from "../../../lib/analyticsFallbackStore";
import { checkRateLimit, getRedisConfig, redisPipeline } from "../../../lib/security";

export const runtime = "nodejs";

const ANALYTICS_KEY = "ecliptic:analytics:events";
const ANALYTICS_TOTALS_KEY = "ecliptic:analytics:totals";
const ANALYTICS_ACTIONS_KEY = "ecliptic:analytics:actions";
const ANALYTICS_PRODUCTS_KEY = "ecliptic:analytics:products";

type IncomingEvent = {
  type?: string;
  path?: string;
  product?: string;
  offer?: string;
  price?: number;
  time?: string;
  visitorId?: string;
  sessionId?: string;
  referrer?: string;
  language?: string;
  timezone?: string;
  screen?: string;
};

function hashIp(value: string | null) {
  if (!value) return undefined;
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function productSlugFromPath(path: string | undefined) {
  const match = String(path || "").match(/^\/products\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]).slice(0, 120) : undefined;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 32_000) {
    return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
  }

  const rateLimit = await checkRateLimit("analytics", 5000, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as IncomingEvent;
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerList.get("x-real-ip") || headerList.get("cf-connecting-ip");
  const userAgent = headerList.get("user-agent") || undefined;
  const country = headerList.get("x-vercel-ip-country") || headerList.get("cf-ipcountry") || undefined;
  const region = headerList.get("x-vercel-ip-country-region") || undefined;
  const city = headerList.get("x-vercel-ip-city") || undefined;
  const ipAddress = forwardedFor || realIp || undefined;
  const ipHash = hashIp(forwardedFor || realIp || null);
  const type = String(body.type || "unknown").slice(0, 64);
  const product = body.product ? String(body.product).slice(0, 120) : productSlugFromPath(body.path);

  const event = {
    type,
    path: body.path || "/",
    product,
    offer: body.offer,
    time: body.time || new Date().toISOString(),
    visitorId: body.visitorId,
    sessionId: body.sessionId,
    referrer: body.referrer,
    language: body.language,
    timezone: body.timezone,
    screen: body.screen,
    ipAddress,
    ipHash,
    country,
    region,
    city,
    userAgent,
  };

  const commands: unknown[][] = [
    ["LPUSH", ANALYTICS_KEY, JSON.stringify(event)],
    ["HINCRBY", ANALYTICS_TOTALS_KEY, "total", "1"],
    ["HINCRBY", ANALYTICS_ACTIONS_KEY, type, "1"],
  ];

  if (type === "page_view") commands.push(["HINCRBY", ANALYTICS_TOTALS_KEY, "views", "1"]);
  if (type === "buy_click") commands.push(["HINCRBY", ANALYTICS_TOTALS_KEY, "buys", "1"]);
  if (type.includes("telegram")) commands.push(["HINCRBY", ANALYTICS_TOTALS_KEY, "telegram", "1"]);
  if (product) commands.push(["HINCRBY", ANALYTICS_PRODUCTS_KEY, product, "1"]);

  try {
    const result = await redisPipeline(commands);
    if (result) return NextResponse.json({ ok: true, stored: true, storage: "redis" });
  } catch {
    // Fall back below so analytics keeps working even while Redis/env is broken.
  }

  await addFallbackAnalyticsEvent(event);
  return NextResponse.json({ ok: true, stored: false, fallbackStored: true, configured: Boolean(getRedisConfig()) });
}
