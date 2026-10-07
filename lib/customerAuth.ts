import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { readAdminFallback, writeAdminFallback } from "./adminFallbackStore";
import { readBlobJson, writeBlobJson } from "./blobJsonStore";
import { getAdminSessionSecret } from "./security";

export type CustomerProvider = "google" | "telegram";

export type CustomerUser = {
  id: string;
  provider: CustomerProvider;
  providerId: string;
  name: string;
  username?: string;
  email?: string;
  avatar?: string;
  createdAt: string;
};

export type CustomerOrder = {
  id: string;
  userId: string;
  createdAt: string;
  productSlug: string;
  offer: string;
  priceRub?: number;
  message?: string;
};

type CustomerSession = {
  user: CustomerUser;
  exp: number;
};

type CustomerStore = {
  users: Record<string, CustomerUser>;
  orders: CustomerOrder[];
  version: 1;
};

const CUSTOMER_SESSION_COOKIE = "ecliptic_customer_session";
const CUSTOMER_STORE_BLOB = "customers/store-v1.json";
const CUSTOMER_STORE_FALLBACK = "customer-store-v1";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

function useSecureCookie() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_URL);
}

function sessionSecret() {
  return process.env.CUSTOMER_SESSION_SECRET || process.env.AUTH_SECRET || getAdminSessionSecret();
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function signPayload(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function createSessionCookie(user: CustomerUser) {
  const payload = base64Url(JSON.stringify({ user, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 }));
  return `${payload}.${signPayload(payload)}`;
}

function verifySessionCookie(value: string): CustomerSession | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = signPayload(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as CustomerSession;
    if (!parsed?.user?.id || !parsed.exp || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function normalizeStore(value: unknown): CustomerStore {
  const fallback: CustomerStore = { users: {}, orders: [], version: 1 };
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;

  const raw = value as Partial<CustomerStore>;
  return {
    users: raw.users && typeof raw.users === "object" && !Array.isArray(raw.users) ? raw.users : {},
    orders: Array.isArray(raw.orders) ? raw.orders.slice(-5000) : [],
    version: 1,
  };
}

async function readCustomerStore() {
  const blob = await readBlobJson<CustomerStore>(CUSTOMER_STORE_BLOB).catch(() => null);
  if (blob) return normalizeStore(blob);

  const fallback = await readAdminFallback<CustomerStore>(CUSTOMER_STORE_FALLBACK);
  return normalizeStore(fallback);
}

async function writeCustomerStore(store: CustomerStore) {
  await writeAdminFallback(CUSTOMER_STORE_FALLBACK, store);
  await writeBlobJson(CUSTOMER_STORE_BLOB, store).catch(() => undefined);
}

function cleanText(value: unknown, fallback: string, limit = 120) {
  if (typeof value !== "string") return fallback;
  return value.replace(/[<>]/g, "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, limit) || fallback;
}

function userId(provider: CustomerProvider, providerId: string) {
  return `${provider}:${createHash("sha256").update(providerId).digest("hex").slice(0, 24)}`;
}

export async function getCustomerUserFromCookies() {
  const cookieStore = await cookies();
  const session = verifySessionCookie(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value || "");
  return session?.user || null;
}

export function setCustomerSession(response: NextResponse, user: CustomerUser) {
  response.cookies.set(CUSTOMER_SESSION_COOKIE, createSessionCookie(user), {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: useSecureCookie(),
  });
}

export function clearCustomerSession(response: NextResponse) {
  response.cookies.set(CUSTOMER_SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: useSecureCookie(),
  });
}

export async function upsertCustomerUser(input: Omit<CustomerUser, "id" | "createdAt">) {
  const store = await readCustomerStore();
  const id = userId(input.provider, input.providerId);
  const current = store.users[id];
  const user: CustomerUser = {
    ...current,
    ...input,
    id,
    createdAt: current?.createdAt || new Date().toISOString(),
  };

  store.users[id] = user;
  await writeCustomerStore(store);
  return user;
}

export async function getCustomerOrders(userIdValue: string) {
  const store = await readCustomerStore();
  return store.orders
    .filter((order) => order.userId === userIdValue)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addCustomerOrder(user: CustomerUser, input: Partial<CustomerOrder>) {
  const productSlug = cleanText(input.productSlug, "", 90);
  const offer = cleanText(input.offer, "Товар", 160);
  if (!productSlug) return null;

  const store = await readCustomerStore();
  const order: CustomerOrder = {
    id: randomUUID(),
    userId: user.id,
    createdAt: new Date().toISOString(),
    productSlug,
    offer,
    priceRub: Number.isFinite(Number(input.priceRub)) ? Math.max(0, Number(input.priceRub)) : undefined,
    message: cleanText(input.message, "", 900),
  };

  store.users[user.id] = user;
  store.orders = [...store.orders, order].slice(-5000);
  await writeCustomerStore(store);
  return order;
}

export async function verifyGoogleCredential(credential: string) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
  if (!clientId) throw new Error("Google authorization is not configured");

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Google authorization failed");

  const data = await response.json() as {
    aud?: string;
    sub?: string;
    email?: string;
    email_verified?: string | boolean;
    name?: string;
    picture?: string;
  };

  if (data.aud !== clientId || !data.sub) throw new Error("Google token is invalid");
  if (data.email_verified === false || data.email_verified === "false") throw new Error("Google email is not verified");

  return upsertCustomerUser({
    provider: "google",
    providerId: data.sub,
    name: cleanText(data.name, data.email || "Google пользователь", 90),
    email: cleanText(data.email, "", 160),
    avatar: cleanText(data.picture, "", 500),
  });
}

export function verifyTelegramInitData(initData: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_WEBAPP_BOT_TOKEN || "";
  if (!botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash") || "";
  params.delete("hash");

  const checkString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = createHmac("sha256", secret).update(checkString).digest("hex");
  const left = Buffer.from(hash);
  const right = Buffer.from(expected);
  if (!hash || left.length !== right.length || !timingSafeEqual(left, right)) return null;

  const authDate = Number(params.get("auth_date") || 0);
  if (!authDate || Date.now() / 1000 - authDate > 60 * 60 * 24) return null;

  const userRaw = params.get("user");
  if (!userRaw) return null;
  return JSON.parse(userRaw) as { id?: number; username?: string; first_name?: string; last_name?: string; photo_url?: string };
}

export async function telegramUserToCustomer(user: { id?: number; username?: string; first_name?: string; last_name?: string; photo_url?: string }) {
  if (!user.id) throw new Error("Telegram user is missing");

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username || "Telegram пользователь";
  return upsertCustomerUser({
    provider: "telegram",
    providerId: String(user.id),
    name: cleanText(name, "Telegram пользователь", 90),
    username: cleanText(user.username ? `@${user.username.replace(/^@/, "")}` : "", "", 80),
    avatar: cleanText(user.photo_url, "", 500),
  });
}
