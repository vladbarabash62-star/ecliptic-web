import { readAdminFallback, writeAdminFallback } from "./adminFallbackStore";
import { readBlobJson, writeBlobJson } from "./blobJsonStore";
import { hasCloudflareState, readCloudflareState, writeCloudflareState } from "./cloudflareStateStore";

const STATE_KEY = "telegram-account-safety-emojis-v1";
const BLOB_KEY = "customers/telegram-account-safety-emojis-v1.json";

export type TelegramCustomEmojiSet = {
  ids: string[];
  template?: string;
  entities?: Array<{ type: string; offset: number; length: number; custom_emoji_id?: string }>;
  pendingEditorChatId?: number;
  updatedAt: string;
  version: 1;
};

function normalize(value: unknown): TelegramCustomEmojiSet | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Partial<TelegramCustomEmojiSet>;
  const ids = Array.isArray(raw.ids)
    ? raw.ids.map((id) => String(id || "").trim()).filter(Boolean).slice(0, 5)
    : [];
  if (!ids.length && typeof raw.template !== "string" && !Number.isFinite(Number(raw.pendingEditorChatId))) return null;
  return {
    ids,
    template: typeof raw.template === "string" ? raw.template : undefined,
    entities: Array.isArray(raw.entities) ? raw.entities as TelegramCustomEmojiSet["entities"] : undefined,
    pendingEditorChatId: Number.isFinite(Number(raw.pendingEditorChatId)) ? Number(raw.pendingEditorChatId) : undefined,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
    version: 1,
  };
}

async function writeSet(next: TelegramCustomEmojiSet) {
  if (hasCloudflareState()) {
    await writeCloudflareState(STATE_KEY, next);
    return true;
  }
  await writeAdminFallback(STATE_KEY, next);
  await writeBlobJson(BLOB_KEY, next).catch(() => undefined);
  return true;
}

export async function saveTelegramCustomEmojiIds(ids: string[]) {
  const normalized = normalize({ ids, updatedAt: new Date().toISOString(), version: 1 });
  if (!normalized) return false;
  const existing = await getTelegramCustomEmojiIds();
  return writeSet({ ...normalized, template: existing?.template, entities: existing?.entities });
}

export async function getTelegramCustomEmojiIds() {
  if (hasCloudflareState()) return normalize(await readCloudflareState<TelegramCustomEmojiSet>(STATE_KEY));
  const blob = normalize(await readBlobJson<TelegramCustomEmojiSet>(BLOB_KEY).catch(() => null));
  if (blob) return blob;
  return normalize(await readAdminFallback<TelegramCustomEmojiSet>(STATE_KEY));
}

export async function beginTelegramAccountNoticeEdit(chatId: number) {
  const current = (await getTelegramCustomEmojiIds()) || { ids: [], updatedAt: new Date().toISOString(), version: 1 as const };
  return writeSet({ ...current, pendingEditorChatId: chatId, updatedAt: new Date().toISOString() });
}

export async function saveTelegramAccountNoticeTemplate(
  chatId: number,
  template: string,
  entities: TelegramCustomEmojiSet["entities"]
) {
  const current = await getTelegramCustomEmojiIds();
  if (!current || current.pendingEditorChatId !== chatId) return false;
  return writeSet({ ...current, template, entities, pendingEditorChatId: undefined, updatedAt: new Date().toISOString() });
}

export async function getTelegramAccountNoticeTemplate() {
  const current = await getTelegramCustomEmojiIds();
  if (!current?.template) return null;
  return { text: current.template, entities: current.entities || [] };
}
