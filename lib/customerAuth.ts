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
  referralCode?: string;
  referredByUserId?: string;
  referredAt?: string;
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

export type CustomerReferralClaim = {
  id: string;
  userId: string;
  createdAt: string;
  invitedCount: number;
  status: "sent" | "pending_manager";
};

type CustomerSession = {
  user: CustomerUser;
  exp: number;
};

type CustomerStore = {
  users: Record<string, CustomerUser>;
  orders: CustomerOrder[];
  referralClaims: CustomerReferralClaim[];
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
  const fallback: CustomerStore = { users: {}, orders: [], referralClaims: [], version: 1 };
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;

  const raw = value as Partial<CustomerStore>;
  return {
    users: raw.users && typeof raw.users === "object" && !Array.isArray(raw.users) ? raw.users : {},
    orders: Array.isArray(raw.orders) ? raw.orders.slice(-5000) : [],
    referralClaims: Array.isArray(raw.referralClaims) ? raw.referralClaims.slice(-1000) : [],
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

export function cleanReferralCode(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
}

function makeReferralCode(id: string) {
  return createHash("sha256")
    .update(`referral|${id}`)
    .digest("base64url")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 8)
    .toLowerCase();
}

function uniqueReferralCode(store: CustomerStore, id: string, currentCode?: string) {
  const cleanCurrent = cleanReferralCode(currentCode);
  if (cleanCurrent && !Object.values(store.users).some((user) => user.id !== id && cleanReferralCode(user.referralCode) === cleanCurrent)) {
    return cleanCurrent;
  }

  const base = makeReferralCode(id) || "ecliptic";
  let code = base;
  let index = 2;
  while (Object.values(store.users).some((user) => user.id !== id && cleanReferralCode(user.referralCode) === code)) {
    code = `${base}${index}`;
    index += 1;
  }
  return code;
}

function findUserByReferralCode(store: CustomerStore, code: string) {
  const cleanCode = cleanReferralCode(code);
  if (!cleanCode) return null;
  return Object.values(store.users).find((user) => cleanReferralCode(user.referralCode) === cleanCode) || null;
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

export async function upsertCustomerUser(input: Omit<CustomerUser, "id" | "createdAt" | "referralCode" | "referredByUserId" | "referredAt">, referrerCode?: string) {
  const store = await readCustomerStore();
  const id = userId(input.provider, input.providerId);
  const current = store.users[id];
  const now = new Date().toISOString();
  const user: CustomerUser = {
    ...current,
    ...input,
    id,
    referralCode: uniqueReferralCode(store, id, current?.referralCode),
    createdAt: current?.createdAt || now,
  };

  const referrer = !current?.referredByUserId ? findUserByReferralCode(store, referrerCode || "") : null;
  if (referrer && referrer.id !== id) {
    user.referredByUserId = referrer.id;
    user.referredAt = now;
  }

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

export async function getCustomerReferralInfo(userIdValue: string, siteUrl = "https://ecliptic.website") {
  const store = await readCustomerStore();
  const user = store.users[userIdValue];
  if (!user) return null;

  const referralCode = uniqueReferralCode(store, user.id, user.referralCode);
  if (user.referralCode !== referralCode) {
    store.users[user.id] = { ...user, referralCode };
    await writeCustomerStore(store);
  }

  const invited = Object.values(store.users)
    .filter((item) => item.referredByUserId === user.id)
    .sort((a, b) => String(b.referredAt || b.createdAt).localeCompare(String(a.referredAt || a.createdAt)))
    .map((item) => ({
      id: item.id,
      name: item.name || item.username || "Пользователь",
      username: item.username || "",
      joinedAt: item.referredAt || item.createdAt,
    }));

  return {
    code: referralCode,
    link: `${siteUrl.replace(/\/$/, "")}/?use=${encodeURIComponent(referralCode)}`,
    invited,
    invitedCount: invited.length,
    lastClaim: store.referralClaims
      .filter((claim) => claim.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null,
  };
}

export async function createCustomerReferralClaim(userIdValue: string, status: CustomerReferralClaim["status"]) {
  const store = await readCustomerStore();
  const user = store.users[userIdValue];
  if (!user) throw new Error("Пользователь не найден.");

  const invitedCount = Object.values(store.users).filter((item) => item.referredByUserId === user.id).length;
  if (invitedCount < 5) throw new Error("Для подарка нужно пригласить минимум 5 друзей.");

  const recentClaim = store.referralClaims
    .filter((claim) => claim.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (recentClaim && Date.now() - new Date(recentClaim.createdAt).getTime() < 24 * 60 * 60 * 1000) {
    return { claim: recentClaim, user, invitedCount, duplicate: true };
  }

  const claim: CustomerReferralClaim = {
    id: randomUUID(),
    userId: user.id,
    createdAt: new Date().toISOString(),
    invitedCount,
    status,
  };

  store.referralClaims = [...store.referralClaims, claim].slice(-1000);
  await writeCustomerStore(store);
  return { claim, user, invitedCount, duplicate: false };
}

export async function getCustomerAdminReferralReport() {
  const store = await readCustomerStore();
  let changed = false;
  for (const user of Object.values(store.users)) {
    const referralCode = uniqueReferralCode(store, user.id, user.referralCode);
    if (user.referralCode !== referralCode) {
      store.users[user.id] = { ...user, referralCode };
      changed = true;
    }
  }
  if (changed) await writeCustomerStore(store);

  const users = Object.values(store.users);
  const ordersByUser = store.orders.reduce<Record<string, CustomerOrder[]>>((acc, order) => {
    if (!acc[order.userId]) acc[order.userId] = [];
    acc[order.userId].push(order);
    return acc;
  }, {});
  const invitedByUser = users.reduce<Record<string, CustomerUser[]>>((acc, user) => {
    if (!user.referredByUserId) return acc;
    if (!acc[user.referredByUserId]) acc[user.referredByUserId] = [];
    acc[user.referredByUserId].push(user);
    return acc;
  }, {});

  return users
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((user) => ({
      id: user.id,
      name: user.name || user.username || "Пользователь",
      username: user.username || "",
      provider: user.provider,
      createdAt: user.createdAt,
      referralCode: user.referralCode || uniqueReferralCode(store, user.id, user.referralCode),
      referredByUserId: user.referredByUserId || "",
      referredAt: user.referredAt || "",
      orders: (ordersByUser[user.id] || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      invited: (invitedByUser[user.id] || [])
        .sort((a, b) => String(b.referredAt || b.createdAt).localeCompare(String(a.referredAt || a.createdAt)))
        .map((item) => ({
          id: item.id,
          name: item.name || item.username || "Пользователь",
          username: item.username || "",
          joinedAt: item.referredAt || item.createdAt,
        })),
    }));
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

export function verifyTelegramLoginData(params: URLSearchParams) {
  const hash = params.get("hash") || "";
  const id = params.get("id") || "";
  const firstName = params.get("first_name") || "";
  const lastName = params.get("last_name") || "";
  const username = params.get("username") || "";
  const photoUrl = params.get("photo_url") || "";
  const authDate = Number(params.get("auth_date") || 0);
  if (!id || !authDate || Date.now() / 1000 - authDate > 60 * 60 * 24) return null;

  const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_WEBAPP_BOT_TOKEN || "";
  if (!botToken && useSecureCookie()) return null;
  if (!botToken) return { id: Number(id), username, first_name: firstName, last_name: lastName, photo_url: photoUrl };

  const checkString = Array.from(params.entries())
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secret = createHash("sha256").update(botToken).digest();
  const expected = createHmac("sha256", secret).update(checkString).digest("hex");
  const left = Buffer.from(hash);
  const right = Buffer.from(expected);
  if (!hash || left.length !== right.length || !timingSafeEqual(left, right)) return null;

  return {
    id: Number(id),
    username,
    first_name: firstName,
    last_name: lastName,
    photo_url: photoUrl,
  };
}

export async function telegramUserToCustomer(user: { id?: number; username?: string; first_name?: string; last_name?: string; photo_url?: string }, referrerCode?: string) {
  if (!user.id) throw new Error("Telegram user is missing");

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username || "Telegram пользователь";
  return upsertCustomerUser({
    provider: "telegram",
    providerId: String(user.id),
    name: cleanText(name, "Telegram пользователь", 90),
    username: cleanText(user.username ? `@${user.username.replace(/^@/, "")}` : "", "", 80),
    avatar: cleanText(user.photo_url, "", 500),
  }, referrerCode);
}
