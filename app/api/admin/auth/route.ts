import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  assertTrustedOrigin,
  checkRateLimit,
  getAdminSessionSecret,
  getAdminSessionValue,
  jsonError,
  verifyAdminPassword,
} from "../../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  password?: string;
  pin?: string;
};

function adminSessionCookie(request: Request) {
  const userAgent = request.headers.get("user-agent") || "";
  const secure = new URL(request.url).protocol === "https:";

  return {
    name: ADMIN_SESSION_COOKIE,
    value: getAdminSessionValue(getAdminSessionSecret(), userAgent),
    options: {
      httpOnly: true,
      secure,
      sameSite: "strict" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  };
}

export async function POST(request: Request) {
  if (!(await assertTrustedOrigin(request))) {
    return jsonError("Bad origin", 403);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4_000) {
    return jsonError("Payload too large", 413);
  }

  const rateLimit = await checkRateLimit("admin-login", 12, 300);
  if (!rateLimit.allowed) {
    return jsonError("Too many requests", 429);
  }

  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const password = body.password || body.pin || "";

  if (!verifyAdminPassword(password)) {
    return jsonError("Wrong password", 403);
  }

  const response = NextResponse.json({ ok: true });
  const cookie = adminSessionCookie(request);
  response.cookies.set(cookie.name, cookie.value, cookie.options);

  return response;
}
