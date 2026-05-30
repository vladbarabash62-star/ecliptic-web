import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";

type RedisConfig = {
  url: string;
  token: string;
};

const FALLBACK_ADMIN_PASSWORD = {
  salt: "d22b99b65d854c5e7c98afe76bb855c0",
  hash: "866b4bcc969a166dab06cf3ab13b76e7879b23eabea5c4020d2664b5cfef2301",
};

const TRUSTED_ORIGINS = new Set([
  "https://ecliptic.website",
  "https://www.ecliptic.website",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

export function getRedisConfig(): RedisConfig | null {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.STORAGE_REST_API_URL ||
    process.env.STORAGE_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.STORAGE_REST_API_TOKEN ||
    process.env.STORAGE_REST_TOKEN;

  if (!url || !token) return null;
  return { url, token };
}

type RedisPipelineOptions = {
  cache?: RequestCache;
  timeoutMs?: number;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

export async function redisPipeline(commands: unknown[][], options: RedisPipelineOptions = {}) {
  const config = getRedisConfig();
  if (!config) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);

  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: options.cache || "no-store",
    next: options.next,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`Redis request failed: ${response.status}`);
  }

  return response.json();
}

export function jsonError(message = "Forbidden", status = 403) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function safeEqual(a = "", b = "") {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function hashPassword(password: string, salt: string) {
  return createHash("sha256").update(`${salt}|${password}`).digest("hex");
}

function passwordRecord() {
  const envHash = process.env.ADMIN_PASSWORD_HASH;
  const envSalt = process.env.ADMIN_PASSWORD_SALT;

  if (envHash && envSalt) {
    return {
      salt: envSalt,
      hash: envHash,
    };
  }

  return FALLBACK_ADMIN_PASSWORD;
}

export function verifyAdminPassword(password: string) {
  const record = passwordRecord();
  return safeEqual(hashPassword(password, record.salt), record.hash);
}

export function getAdminSessionSecret() {
  return passwordRecord().hash;
}

export function getAdminPathSecret() {
  return process.env.ADMIN_SECRET_PATH || "";
}

function getAdminGateValue(secret: string, userAgent: string) {
  return createHash("sha256").update(`${secret}|${userAgent || "unknown-agent"}`).digest("hex");
}

export const ADMIN_SESSION_COOKIE = "ecliptic_admin_session";

export function getAdminSessionValue(sessionSecret: string, userAgent: string) {
  return createHash("sha256").update(`admin-session|${sessionSecret}|${userAgent || "unknown-agent"}`).digest("hex");
}

export async function getClientIpHash() {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerList.get("x-real-ip");
  const rawIp = forwardedFor || realIp || "unknown";

  return createHash("sha256").update(rawIp).digest("hex").slice(0, 24);
}

export async function assertTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin) return true;
  if (TRUSTED_ORIGINS.has(origin)) return true;
  if (host && origin === `https://${host}`) return true;
  if (host && origin === `http://${host}` && host.startsWith("localhost")) return true;

  return false;
}

export async function checkRateLimit(scope: string, limit: number, windowSeconds: number) {
  const ipHash = await getClientIpHash();
  const key = `ecliptic:ratelimit:${scope}:${ipHash}`;
  const result = await redisPipeline([
    ["INCR", key],
    ["EXPIRE", key, String(windowSeconds)],
  ], { timeoutMs: 1500 }).catch(() => null);
  const current = Number(result?.[0]?.result || 0);

  return {
    allowed: current === 0 || current <= limit,
    current,
    ipHash,
  };
}

export async function validateAdminRequest(request: Request, pin?: string) {
  if (!(await assertTrustedOrigin(request))) {
    return jsonError("Bad origin", 403);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 6_000_000) {
    return jsonError("Payload too large", 413);
  }

  const rateLimit = await checkRateLimit("admin", 25, 60);
  if (!rateLimit.allowed) {
    return jsonError("Too many requests", 429);
  }

  const secret = getAdminPathSecret();
  const cookieStore = await cookies();
  const headerList = await headers();
  const adminGate = cookieStore.get("ecliptic_admin_gate")?.value || "";
  const expectedGate = secret ? getAdminGateValue(secret, headerList.get("user-agent") || "") : "";
  if (secret && !safeEqual(adminGate, expectedGate)) {
    return jsonError("Admin gate required", 404);
  }

  const adminSession = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || "";
  const expectedSession = getAdminSessionValue(getAdminSessionSecret(), headerList.get("user-agent") || "");
  if (safeEqual(adminSession, expectedSession)) {
    return null;
  }

  if (!verifyAdminPassword(pin || "")) {
    const failedLimit = await checkRateLimit("admin-failed-pin", 8, 300);
    if (!failedLimit.allowed) {
      return jsonError("Too many failed attempts", 429);
    }

    return jsonError("Forbidden", 403);
  }

  return null;
}
