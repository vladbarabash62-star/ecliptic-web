import { readAdminFallback, writeAdminFallback } from "./adminFallbackStore";
import { readBlobJson, writeBlobJson } from "./blobJsonStore";
import { hasCloudflareState, readCloudflareState, writeCloudflareState } from "./cloudflareStateStore";

const FALLBACK_KEY = "telegram-stars-drafts-v1";
const BLOB_KEY = "customers/telegram-stars-drafts-v1.json";

export type TelegramStarsDraft = {
  chatId: number;
  username?: string;
  amount?: number;
  step: "username" | "amount" | "confirm";
  updatedAt: string;
};

type Store = { drafts: Record<string, TelegramStarsDraft>; version: 1 };

function normalize(value: unknown): Store {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { drafts: {}, version: 1 };
  const raw = value as Partial<Store>;
  const drafts = raw.drafts && typeof raw.drafts === "object" && !Array.isArray(raw.drafts)
    ? Object.fromEntries(Object.entries(raw.drafts).filter(([, draft]) => draft && typeof draft === "object")) as Record<string, TelegramStarsDraft>
    : {};
  return { drafts, version: 1 };
}

async function readStore() {
  if (hasCloudflareState()) return normalize(await readCloudflareState<Store>(FALLBACK_KEY));
  const blob = await readBlobJson<Store>(BLOB_KEY).catch(() => null);
  if (blob) return normalize(blob);
  return normalize(await readAdminFallback<Store>(FALLBACK_KEY));
}

async function writeStore(store: Store) {
  if (hasCloudflareState()) {
    await writeCloudflareState(FALLBACK_KEY, store);
    return;
  }
  await writeAdminFallback(FALLBACK_KEY, store);
  await writeBlobJson(BLOB_KEY, store).catch(() => undefined);
}

export async function getTelegramStarsDraft(chatId: number) {
  const store = await readStore();
  const draft = store.drafts[String(chatId)];
  if (!draft) return null;
  if (Date.now() - Date.parse(draft.updatedAt) > 30 * 60 * 1000) {
    delete store.drafts[String(chatId)];
    await writeStore(store);
    return null;
  }
  return draft;
}

export async function saveTelegramStarsDraft(draft: TelegramStarsDraft) {
  const store = await readStore();
  store.drafts[String(draft.chatId)] = draft;
  await writeStore(store);
  return draft;
}

export async function clearTelegramStarsDraft(chatId: number) {
  const store = await readStore();
  delete store.drafts[String(chatId)];
  await writeStore(store);
}
