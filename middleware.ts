import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "ecliptic_admin_gate";

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function adminFingerprint(request: NextRequest) {
  return request.headers.get("user-agent") || "unknown-agent";
}

function notFound(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return new NextResponse("Not Found", { status: 404 });
}

async function createAdminGateValue(request: NextRequest, secret: string) {
  return sha256(`${secret}|${adminFingerprint(request)}`);
}

function setAdminCookie(response: NextResponse, value: string) {
  response.cookies.set(ADMIN_COOKIE, value, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

function isPageRequest(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (request.nextUrl.pathname.startsWith("/api/")) return false;

  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html") || accept === "*/*" || !accept;
}

function preparePageResponse(request: NextRequest, response: NextResponse) {
  if (!isPageRequest(request)) return response;

  response.headers.set("Cache-Control", "private, no-cache, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}

export async function middleware(request: NextRequest) {
  const secretPath = process.env.ADMIN_SECRET_PATH;
  const pathname = request.nextUrl.pathname.replace(/\/+$/, "") || "/";

  if (!secretPath) return preparePageResponse(request, NextResponse.next());

  const secretRoot = `/${secretPath}`;
  const expectedGate = await createAdminGateValue(request, secretPath);
  const hasAdminGate = request.cookies.get(ADMIN_COOKIE)?.value === expectedGate;

  if (pathname === "/admin-access") {
    const response = NextResponse.redirect(new URL("/admin", request.url));
    setAdminCookie(response, expectedGate);
    return preparePageResponse(request, response);
  }

  if (pathname === "/admin-access/products") {
    const response = NextResponse.redirect(new URL("/admin/products", request.url));
    setAdminCookie(response, expectedGate);
    return preparePageResponse(request, response);
  }

  if (pathname === secretRoot) {
    const response = NextResponse.rewrite(new URL("/admin", request.url));
    setAdminCookie(response, expectedGate);
    return preparePageResponse(request, response);
  }

  if (pathname === `${secretRoot}/products`) {
    const response = NextResponse.rewrite(new URL("/admin/products", request.url));
    setAdminCookie(response, expectedGate);
    return preparePageResponse(request, response);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (hasAdminGate) return preparePageResponse(request, NextResponse.next());

    const response = NextResponse.next();
    setAdminCookie(response, expectedGate);
    return preparePageResponse(request, response);
  }

  if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) {
    return hasAdminGate ? NextResponse.next() : notFound(request);
  }

  return preparePageResponse(request, NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
