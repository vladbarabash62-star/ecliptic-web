import { randomUUID } from "node:crypto";
import { readAdminFallback, writeAdminFallback } from "./adminFallbackStore";
import { readBlobJson, writeBlobJson } from "./blobJsonStore";

type TelegramLoginUser = {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

type PendingTelegramLogin = {
  createdAt: string;
  expiresAt: string;
  user?: TelegramLoginUser;
  referrerCode?: string;
};

type TelegramLoginStore = {
  pending: Record<string, PendingTelegramLogin>;
  version: 1;
};

const TELEGRAM_LOGIN_BLOB = "customers/telegram-login-v1.json";
const TELEGRAM_LOGIN_FALLBACK = "telegram-login-v1";
const LOGIN_TTL_MS = 10 * 60 * 1000;

function normalizeStore(value: unknown): TelegramLoginStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { pending: {}, version: 1 };

  const raw = value as Partial<TelegramLoginStore>;
  const pending = raw.pending && typeof raw.pending === "object" && !Array.isArray(raw.pending) ? raw.pending : {};
  const now = Date.now();

  return {
    pending: Object.fromEntries(
      Object.entries(pending).filter(([, login]) => {
        return login?.expiresAt && new Date(login.expiresAt).getTime() > now;
      })
    ),
    version: 1,
  };
}

async function readStore() {
  const blob = await readBlobJson<TelegramLoginStore>(TELEGRAM_LOGIN_BLOB).catch(() => null);
  if (blob) return normalizeStore(blob);

  const fallback = await readAdminFallback<TelegramLoginStore>(TELEGRAM_LOGIN_FALLBACK);
  return normalizeStore(fallback);
}

async function writeStore(store: TelegramLoginStore) {
  await writeAdminFallback(TELEGRAM_LOGIN_FALLBACK, store);
  await writeBlobJson(TELEGRAM_LOGIN_BLOB, store).catch(() => undefined);
}

export function createTelegramLoginToken() {
  return randomUUID();
}

export async function createPendingTelegramLogin(referrerCode?: string) {
  const token = createTelegramLoginToken();
  const store = await readStore();
  const now = new Date();
  store.pending[token] = {
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + LOGIN_TTL_MS).toISOString(),
    referrerCode: String(referrerCode || "").trim().slice(0, 32) || undefined,
  };
  await writeStore(store);
  return token;
}

export async function savePendingTelegramLogin(token: string, user: TelegramLoginUser) {
  if (!/^[a-f0-9-]{20,80}$/i.test(token) || !user.id) return false;

  const store = await readStore();
  const current = store.pending[token];
  const now = new Date();
  store.pending[token] = {
    ...current,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + LOGIN_TTL_MS).toISOString(),
    user,
  };

  await writeStore(store);
  return true;
}

export async function consumePendingTelegramLogin(token: string) {
  if (!/^[a-f0-9-]{20,80}$/i.test(token)) return null;

  const store = await readStore();
  const login = store.pending[token];
  delete store.pending[token];
  await writeStore(store);

  if (!login || new Date(login.expiresAt).getTime() <= Date.now()) return null;
  return login;
}
