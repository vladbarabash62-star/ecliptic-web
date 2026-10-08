import { readAdminFallback, writeAdminFallback } from "./adminFallbackStore";

const MANAGER_CHAT_FALLBACK = "telegram-manager-chat-v1";
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

  await writeAdminFallback(MANAGER_CHAT_FALLBACK, {
    chatId: Number(chatId),
    username: cleanUsername,
    updatedAt: new Date().toISOString(),
    version: 1,
  } satisfies ManagerChatStore);
  return true;
}

export async function getManagerChatId() {
  const fromEnv = process.env.REFERRAL_MANAGER_CHAT_ID || process.env.TELEGRAM_MANAGER_CHAT_ID || "";
  if (fromEnv.trim()) return fromEnv.trim();

  const stored = normalize(await readAdminFallback<ManagerChatStore>(MANAGER_CHAT_FALLBACK));
  if (stored.chatId) return String(stored.chatId);

  return "@Ecliptic_Store_PMR";
}
