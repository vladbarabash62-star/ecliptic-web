import { NextResponse } from "next/server";
import { getRedisConfig, redisPipeline, validateAdminRequest } from "../../../../lib/security";

export const runtime = "nodejs";

const ANALYTICS_KEY = "ecliptic:analytics:events";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { pin?: string };
  const authError = await validateAdminRequest(request, body.pin);
  if (authError) return authError;

  let result = null;

  try {
    result = await redisPipeline([["LRANGE", ANALYTICS_KEY, "0", "4999"]]);
  } catch {
    return NextResponse.json({
      ok: true,
      configured: Boolean(getRedisConfig()),
      events: [],
      error: "Redis unavailable",
    });
  }
  const rawEvents = result?.[0]?.result || [];
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
  });
}
