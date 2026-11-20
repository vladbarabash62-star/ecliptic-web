import { readAdminFallback, writeAdminFallback } from "./adminFallbackStore";
import { readBlobJson, writeBlobJson } from "./blobJsonStore";
import { hasCloudflareState, readCloudflareState, writeCloudflareState } from "./cloudflareStateStore";

const STATE_KEY = "telegram-pending-orders-v1";
const BLOB_PATH = "customers/telegram-pending-orders-v1.json";

export type PendingTelegramOrder = {
  chatId: number;
  businessConnectionId?: string;
  orderCode: string;
  amount: string;
  orderMessage: string;
  createdAt: string;
  paymentNotificationClaimedAt?: string;
};

type PendingOrderStore = Record<string, PendingTelegramOrder>;

function normalize(value: unknown): PendingOrderStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as PendingOrderStore;
}

async function readStore() {
  if (hasCloudflareState()) return normalize(await readCloudflareState<PendingOrderStore>(STATE_KEY));
  const blob = await readBlobJson<PendingOrderStore>(BLOB_PATH).catch(() => null);
  return blob ? normalize(blob) : normalize(await readAdminFallback<PendingOrderStore>(STATE_KEY));
}

async function writeStore(store: PendingOrderStore) {
  if (hasCloudflareState()) {
    await writeCloudflareState(STATE_KEY, store);
    return;
  }
  await writeAdminFallback(STATE_KEY, store);
  await writeBlobJson(BLOB_PATH, store).catch(() => undefined);
}

export async function savePendingTelegramOrder(order: PendingTelegramOrder) {
  const store = await readStore();
  store[String(order.chatId)] = order;
  await writeStore(store);
}

export async function getPendingTelegramOrder(chatId: number) {
  const store = await readStore();
  const order = store[String(chatId)];
  if (!order) return null;
  const createdAt = Date.parse(order.createdAt);
  // A pending payment is valid only for one day. This prevents an old order
  // from turning an unrelated future message or screenshot into a payment.
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > 24 * 60 * 60 * 1000) {
    delete store[String(chatId)];
    await writeStore(store).catch(() => undefined);
    return null;
  }
  return order;
}

export async function clearPendingTelegramOrder(chatId: number) {
  const store = await readStore();
  if (!store[String(chatId)]) return;
  delete store[String(chatId)];
  await writeStore(store);
}

export async function claimPaymentNotification(chatId: number) {
  const store = await readStore();
  const order = store[String(chatId)];
  if (!order || order.paymentNotificationClaimedAt) return false;
  order.paymentNotificationClaimedAt = new Date().toISOString();
  await writeStore(store);
  return true;
}

export async function releasePaymentNotificationClaim(chatId: number) {
  const store = await readStore();
  const order = store[String(chatId)];
  if (!order) return;
  delete order.paymentNotificationClaimedAt;
  await writeStore(store);
}