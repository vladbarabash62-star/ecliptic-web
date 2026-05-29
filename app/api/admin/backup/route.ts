import { NextResponse } from "next/server";
import { getProducts } from "../../../../lib/productStore";
import { getBackupPassword, getRedisConfig, redisPipeline, safeEqual, validateAdminRequest } from "../../../../lib/security";
import { getSiteSettings } from "../../../../lib/siteSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANALYTICS_KEY = "ecliptic:analytics:events";

type RequestBody = {
  pin?: string;
  backupPassword?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const authError = await validateAdminRequest(request, body.pin);
  if (authError) return authError;

  if (!safeEqual(body.backupPassword || "", getBackupPassword())) {
    return NextResponse.json({ ok: false, error: "Wrong backup password" }, { status: 403 });
  }

  const [products, settings] = await Promise.all([getProducts(), getSiteSettings()]);
  let events: unknown[] = [];

  try {
    const result = await redisPipeline([["LRANGE", ANALYTICS_KEY, "0", "4999"]]);
    const rawEvents = result?.[0]?.result || [];
    events = Array.isArray(rawEvents)
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
  } catch {
    events = [];
  }

  const payload = {
    ok: true,
    createdAt: new Date().toISOString(),
    site: "ecliptic.website",
    database: {
      configured: Boolean(getRedisConfig()),
      provider: "Vercel KV / Upstash Redis",
    },
    settings,
    products,
    analytics: {
      events,
    },
  };
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="ecliptic-backup-${stamp}.json"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
