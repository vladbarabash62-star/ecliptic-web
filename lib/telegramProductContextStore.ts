import { readAdminFallback, writeAdminFallback } from "./adminFallbackStore";
import { readBlobJson, writeBlobJson } from "./blobJsonStore";
import { hasCloudflareState, readCloudflareState, writeCloudflareState } from "./cloudflareStateStore";

const STATE_KEY = "telegram-product-context-v1";
const BLOB_PATH = "customers/telegram-product-context-v1.json";

export type TelegramProductContext = {
  productSlug: string;
  offerLabel: string;
  amount: string;
  sourceMessage: string;
  sitePrice?: number;
  updatedAt: string;
};

type ProductContextStore = Record<string, TelegramProductContext>;

function normalize(value: unknown): ProductContextStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([chatId, raw]) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const record = raw as Record<string, unknown>;
    if (
      typeof record.productSlug !== "string"
      || typeof record.offerLabel !== "string"
      || typeof record.amount !== "string"
      || typeof record.sourceMessage !== "string"
      || typeof record.updatedAt !== "string"
    ) return [];
    return [[chatId, {
      productSlug: record.productSlug,
      offerLabel: record.offerLabel,
      amount: record.amount,
      sourceMessage: record.sourceMessage,
      ...(typeof record.sitePrice === "number" ? { sitePrice: record.sitePrice } : {}),
      updatedAt: record.updatedAt,
    } satisfies TelegramProductContext]];
  }));
}

async function readStore() {
  if (hasCloudflareState()) return normalize(await readCloudflareState<ProductContextStore>(STATE_KEY));
  const blob = await readBlobJson<ProductContextStore>(BLOB_PATH).catch(() => null);
  return blob ? normalize(blob) : normalize(await readAdminFallback<ProductContextStore>(STATE_KEY));
}

async function writeStore(store: ProductContextStore) {
  if (hasCloudflareState()) {
    await writeCloudflareState(STATE_KEY, store);
    return;
  }
  await writeAdminFallback(STATE_KEY, store);
  await writeBlobJson(BLOB_PATH, store).catch(() => undefined);
}

export async function saveTelegramProductContext(
  chatId: number,
  context: Omit<TelegramProductContext, "updatedAt">
) {
  const store = await readStore();
  store[String(chatId)] = { ...context, updatedAt: new Date().toISOString() };
  await writeStore(store);
}

export async function getTelegramProductContext(chatId: number, maxAgeMs = 30 * 60 * 1000) {
  const context = (await readStore())[String(chatId)];
  if (!context) return null;
  const updatedAt = Date.parse(context.updatedAt);
  if (!Number.isFinite(updatedAt) || Date.now() - updatedAt > maxAgeMs) return null;
  return context;
}
