import { readAdminFallback, writeAdminFallback } from "./adminFallbackStore";
import { readBlobJson, writeBlobJson } from "./blobJsonStore";
import { hasCloudflareState, readCloudflareState, writeCloudflareState } from "./cloudflareStateStore";

const MANAGER_CHAT_FALLBACK = "telegram-manager-chat-v1";
const MANAGER_CHAT_BLOB = "customers/telegram-manager-chat-v1.json";
const MANAGER_USERNAME = "ecliptic_store_pmr";

type ManagerChatStore = {
  chatId?: number;
  username?: string;
  updatedAt?: string;
  version: 1;
};

function normalize(value: unknown): ManagerChatStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { version: 1 };
  const raw = value as Partial<ManagerChatStore>;
  return {
    chatId: Number.isFinite(Number(raw.chatId)) ? Number(raw.chatId) : undefined,
    username: typeof raw.username === "string" ? raw.username : undefined,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    version: 1,
  };
}

export async function rememberManagerChat(username: string | undefined, chatId: number | undefined) {
  const cleanUsername = String(username || "").replace(/^@/, "").toLowerCase();
  if (cleanUsername !== MANAGER_USERNAME || !Number.isFinite(Number(chatId))) return false;

  const nextStore = {
    chatId: Number(chatId),
    username: cleanUsername,
    updatedAt: new Date().toISOString(),
    version: 1,
  } satisfies ManagerChatStore;

  if (hasCloudflareState()) {
    await writeCloudflareState(MANAGER_CHAT_FALLBACK, nextStore);
    return true;
  }
  await writeAdminFallback(MANAGER_CHAT_FALLBACK, nextStore);
  await writeBlobJson(MANAGER_CHAT_BLOB, nextStore).catch(() => undefined);
  return true;
}

export async function rememberBusinessManagerChat(chatId: number | undefined) {
  if (!Number.isFinite(Number(chatId))) return false;

  const nextStore = {
    chatId: Number(chatId),
    username: MANAGER_USERNAME,
    updatedAt: new Date().toISOString(),
    version: 1,
  } satisfies ManagerChatStore;

  if (hasCloudflareState()) {
    await writeCloudflareState(MANAGER_CHAT_FALLBACK, nextStore);
    return true;
  }
  await writeAdminFallback(MANAGER_CHAT_FALLBACK, nextStore);
  await writeBlobJson(MANAGER_CHAT_BLOB, nextStore).catch(() => undefined);
  return true;
}

export async function getManagerChatId() {
  if (hasCloudflareState()) {
    const stateStore = normalize(await readCloudflareState<ManagerChatStore>(MANAGER_CHAT_FALLBACK));
    if (stateStore.chatId) return String(stateStore.chatId);
  }

  const blobStore = normalize(await readBlobJson<ManagerChatStore>(MANAGER_CHAT_BLOB).catch(() => null));
  if (blobStore.chatId) return String(blobStore.chatId);

  const fallbackStore = normalize(await readAdminFallback<ManagerChatStore>(MANAGER_CHAT_FALLBACK));
  if (fallbackStore.chatId) {
    await writeBlobJson(MANAGER_CHAT_BLOB, fallbackStore).catch(() => undefined);
    return String(fallbackStore.chatId);
  }

  const fromEnv = process.env.REFERRAL_MANAGER_CHAT_ID || process.env.TELEGRAM_MANAGER_CHAT_ID || "";
  if (fromEnv.trim()) return fromEnv.trim();

  return "";
}
