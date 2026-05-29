import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { checkRateLimit, getRedisConfig, redisPipeline } from "../../../lib/security";

export const runtime = "nodejs";

const ANALYTICS_KEY = "ecliptic:analytics:events";
const MAX_EVENTS = 5000;

type IncomingEvent = {
  type?: string;
  path?: string;
  product?: string;
  offer?: string;
  time?: string;
  visitorId?: string;
  sessionId?: string;
  referrer?: string;
  language?: string;
  timezone?: string;
  screen?: string;
  telegramUser?: {
    id?: number;
    username?: string;
    firstName?: string;
  };
};

function hashIp(value: string | null) {
  if (!value) return undefined;
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 32_000) {
    return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
  }

  const rateLimit = await checkRateLimit("analytics", 180, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as IncomingEvent;
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerList.get("x-real-ip");
  const userAgent = headerList.get("user-agent") || undefined;
  const country = headerList.get("x-vercel-ip-country") || undefined;
  const region = headerList.get("x-vercel-ip-country-region") || undefined;
  const city = headerList.get("x-vercel-ip-city") || undefined;

  const event = {
    type: body.type || "unknown",
    path: body.path || "/",
    product: body.product,
    offer: body.offer,
    time: body.time || new Date().toISOString(),
    visitorId: body.visitorId,
    sessionId: body.sessionId,
    referrer: body.referrer,
    language: body.language,
    timezone: body.timezone,
    screen: body.screen,
    telegramUser: body.telegramUser,
    ipHash: hashIp(forwardedFor || realIp || null),
    country,
    region,
    city,
    userAgent,
  };

  try {
    await redisPipeline([
      ["LPUSH", ANALYTICS_KEY, JSON.stringify(event)],
      ["LTRIM", ANALYTICS_KEY, "0", String(MAX_EVENTS - 1)],
    ]);
  } catch {
    return NextResponse.json({ ok: true, stored: false });
  }

  return NextResponse.json({ ok: true, stored: Boolean(getRedisConfig()) });
}
