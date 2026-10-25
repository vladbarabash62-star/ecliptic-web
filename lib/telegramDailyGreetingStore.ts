import { readAdminFallback, writeAdminFallback } from "./adminFallbackStore";
import { readBlobJson, writeBlobJson } from "./blobJsonStore";
import { hasCloudflareState, readCloudflareState, writeCloudflareState } from "./cloudflareStateStore";

const STATE_KEY = "telegram-daily-greetings-v1";
const BLOB_KEY = "customers/telegram-daily-greetings-v1.json";
type GreetingRecord = { greetingDate?: string; lastActivityAt?: string };
type GreetingStore = Record<string, GreetingRecord>;

function normalize(value: unknown): GreetingStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([chatId, raw]) => {
    if (typeof raw === "string") return [chatId, { greetingDate: raw } satisfies GreetingRecord];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [chatId, {} satisfies GreetingRecord];
    const record = raw as Record<string, unknown>;
    return [chatId, {
      ...(typeof record.greetingDate === "string" ? { greetingDate: record.greetingDate } : {}),
      ...(typeof record.lastActivityAt === "string" ? { lastActivityAt: record.lastActivityAt } : {}),
    } satisfies GreetingRecord];
  }));
}

async function readStore() {
  if (hasCloudflareState()) return normalize(await readCloudflareState<GreetingStore>(STATE_KEY));
  const blob = await readBlobJson<GreetingStore>(BLOB_KEY).catch(() => null);
  return blob ? normalize(blob) : normalize(await readAdminFallback<GreetingStore>(STATE_KEY));
}

async function writeStore(store: GreetingStore) {
  if (hasCloudflareState()) {
    await writeCloudflareState(STATE_KEY, store);
    return;
  }
  await writeAdminFallback(STATE_KEY, store);
  await writeBlobJson(BLOB_KEY, store).catch(() => undefined);
}

export async function claimDailyGreeting(chatId: number) {
  const store = await readStore();
  const key = String(chatId);
  const current = store[key] || {};
  const lastActivity = current.lastActivityAt ? Date.parse(current.lastActivityAt) : 0;
  const shouldGreet = lastActivity <= 0 || Date.now() - lastActivity >= 24 * 60 * 60 * 1000;
  store[key] = { ...current, lastActivityAt: new Date().toISOString() };
  await writeStore(store);
  return shouldGreet;
}

export async function noteTelegramChatActivity(chatId: number) {
  const store = await readStore();
  const key = String(chatId);
  store[key] = { ...(store[key] || {}), lastActivityAt: new Date().toISOString() };
  await writeStore(store);
}
