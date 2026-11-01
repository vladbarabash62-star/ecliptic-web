import { readAdminFallback, writeAdminFallback } from "./adminFallbackStore";
import { readBlobJson, writeBlobJson } from "./blobJsonStore";
import { hasCloudflareState, readCloudflareState, writeCloudflareState } from "./cloudflareStateStore";

const STATE_KEY = "telegram-chat-history-v1";
const BLOB_PATH = "customers/telegram-chat-history-v1.json";
const MAX_SEEN_MESSAGE_IDS = 200;
const ESTABLISHED_MESSAGE_COUNT = 20;

export type TelegramChatHistoryRecord = {
  messageCount: number;
  hasOrder: boolean;
  seenMessageIds: number[];
  updatedAt: string;
};

type TelegramChatHistoryStore = Record<string, TelegramChatHistoryRecord>;

function normalize(value: unknown): TelegramChatHistoryStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([chatId, raw]) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const record = raw as Record<string, unknown>;
    const messageCount = typeof record.messageCount === "number" && Number.isFinite(record.messageCount)
      ? Math.max(0, Math.floor(record.messageCount))
      : 0;
    const seenMessageIds = Array.isArray(record.seenMessageIds)
      ? record.seenMessageIds.filter((id): id is number => typeof id === "number" && Number.isFinite(id)).slice(-MAX_SEEN_MESSAGE_IDS)
      : [];
    return [[chatId, {
      messageCount,
      hasOrder: record.hasOrder === true,
      seenMessageIds,
      updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : new Date(0).toISOString(),
    } satisfies TelegramChatHistoryRecord]];
  }));
}

async function readStore() {
  if (hasCloudflareState()) return normalize(await readCloudflareState<TelegramChatHistoryStore>(STATE_KEY));
  const blob = await readBlobJson<TelegramChatHistoryStore>(BLOB_PATH).catch(() => null);
  return blob ? normalize(blob) : normalize(await readAdminFallback<TelegramChatHistoryStore>(STATE_KEY));
}

async function writeStore(store: TelegramChatHistoryStore) {
  if (hasCloudflareState()) {
    await writeCloudflareState(STATE_KEY, store);
    return;
  }
  await writeAdminFallback(STATE_KEY, store);
  await writeBlobJson(BLOB_PATH, store).catch(() => undefined);
}

function isEstablished(record: TelegramChatHistoryRecord) {
  return record.hasOrder || record.messageCount >= ESTABLISHED_MESSAGE_COUNT;
}

export async function noteTelegramCustomerMessage(chatId: number, messageId?: number) {
  const store = await readStore();
  const key = String(chatId);
  const current = store[key] || {
    messageCount: 0,
    hasOrder: false,
    seenMessageIds: [],
    updatedAt: new Date(0).toISOString(),
  } satisfies TelegramChatHistoryRecord;
  const isDuplicate = typeof messageId === "number" && current.seenMessageIds.includes(messageId);
  const next: TelegramChatHistoryRecord = {
    ...current,
    messageCount: isDuplicate ? current.messageCount : current.messageCount + 1,
    seenMessageIds: typeof messageId === "number" && !isDuplicate
      ? [...current.seenMessageIds, messageId].slice(-MAX_SEEN_MESSAGE_IDS)
      : current.seenMessageIds,
    updatedAt: new Date().toISOString(),
  };
  store[key] = next;
  await writeStore(store);
  return { messageCount: next.messageCount, established: isEstablished(next) };
}

export async function markTelegramChatOrder(chatId: number) {
  const store = await readStore();
  const key = String(chatId);
  const current = store[key] || {
    messageCount: 0,
    hasOrder: false,
    seenMessageIds: [],
    updatedAt: new Date(0).toISOString(),
  } satisfies TelegramChatHistoryRecord;
  store[key] = { ...current, hasOrder: true, updatedAt: new Date().toISOString() };
  await writeStore(store);
}
