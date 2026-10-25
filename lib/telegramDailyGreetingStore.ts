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

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Chisinau",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function claimDailyGreeting(chatId: number) {
  const store = await readStore();
  const key = String(chatId);
  const today = todayKey();
  const current = store[key] || {};
  const lastActivity = current.lastActivityAt ? Date.parse(current.lastActivityAt) : 0;
  const recentConversation = lastActivity > 0 && Date.now() - lastActivity < 10 * 60 * 1000;
  const shouldGreet = current.greetingDate !== today && !recentConversation;
  store[key] = { ...current, lastActivityAt: new Date().toISOString(), ...(shouldGreet ? { greetingDate: today } : {}) };
  await writeStore(store);
  return shouldGreet;
}

export async function noteTelegramChatActivity(chatId: number) {
  const store = await readStore();
  const key = String(chatId);
  store[key] = { ...(store[key] || {}), lastActivityAt: new Date().toISOString() };
  await writeStore(store);
}
