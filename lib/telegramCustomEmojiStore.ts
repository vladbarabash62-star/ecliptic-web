import { readAdminFallback, writeAdminFallback } from "./adminFallbackStore";
import { readBlobJson, writeBlobJson } from "./blobJsonStore";
import { hasCloudflareState, readCloudflareState, writeCloudflareState } from "./cloudflareStateStore";

const STATE_KEY = "telegram-account-safety-emojis-v1";
const BLOB_KEY = "customers/telegram-account-safety-emojis-v1.json";

export type TelegramCustomEmojiSet = {
  ids: string[];
  updatedAt: string;
  version: 1;
};

function normalize(value: unknown): TelegramCustomEmojiSet | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Partial<TelegramCustomEmojiSet>;
  const ids = Array.isArray(raw.ids)
    ? raw.ids.map((id) => String(id || "").trim()).filter(Boolean).slice(0, 5)
    : [];
  if (!ids.length) return null;
  return {
    ids,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
    version: 1,
  };
}

export async function saveTelegramCustomEmojiIds(ids: string[]) {
  const normalized = normalize({ ids, updatedAt: new Date().toISOString(), version: 1 });
  if (!normalized) return false;
  if (hasCloudflareState()) {
    await writeCloudflareState(STATE_KEY, normalized);
    return true;
  }
  await writeAdminFallback(STATE_KEY, normalized);
  await writeBlobJson(BLOB_KEY, normalized).catch(() => undefined);
  return true;
}

export async function getTelegramCustomEmojiIds() {
  if (hasCloudflareState()) return normalize(await readCloudflareState<TelegramCustomEmojiSet>(STATE_KEY));
  const blob = normalize(await readBlobJson<TelegramCustomEmojiSet>(BLOB_KEY).catch(() => null));
  if (blob) return blob;
  return normalize(await readAdminFallback<TelegramCustomEmojiSet>(STATE_KEY));
}
