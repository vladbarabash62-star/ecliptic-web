import { readAdminFallback, writeAdminFallback } from "./adminFallbackStore";
import { readBlobJson, writeBlobJson } from "./blobJsonStore";
import { hasCloudflareState, readCloudflareState, writeCloudflareState } from "./cloudflareStateStore";

const STATE_KEY = "telegram-daily-greetings-v1";
const BLOB_KEY = "customers/telegram-daily-greetings-v1.json";
type GreetingStore = Record<string, string>;

function normalize(value: unknown): GreetingStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([, date]) => typeof date === "string") as Array<[string, string]>
  );
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
  if (store[key] === today) return false;
  store[key] = today;
  await writeStore(store);
  return true;
}
