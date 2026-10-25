import { readAdminFallback, writeAdminFallback } from "./adminFallbackStore";
import { readBlobJson, writeBlobJson } from "./blobJsonStore";
import { hasCloudflareState, readCloudflareState, writeCloudflareState } from "./cloudflareStateStore";

const STATE_KEY = "telegram-ai-usage-v1";
const BLOB_KEY = "customers/telegram-ai-usage-v1.json";
const DAILY_LIMIT = 30;
type Usage = { date: string; count: number };

let transientUsage: Usage | null = null;

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Chisinau", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function normalize(value: unknown): Usage {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { date: "", count: 0 };
  const raw = value as Partial<Usage>;
  return { date: typeof raw.date === "string" ? raw.date : "", count: Math.max(0, Number(raw.count) || 0) };
}

async function readUsage() {
  if (hasCloudflareState()) return normalize(await readCloudflareState<Usage>(STATE_KEY));
  const blob = await readBlobJson<Usage>(BLOB_KEY).catch(() => null);
  return blob ? normalize(blob) : normalize(await readAdminFallback<Usage>(STATE_KEY));
}

async function writeUsage(value: Usage) {
  if (hasCloudflareState()) {
    await writeCloudflareState(STATE_KEY, value);
    return;
  }
  await writeAdminFallback(STATE_KEY, value);
  await writeBlobJson(BLOB_KEY, value).catch(() => undefined);
}

export async function claimAiReplySlot() {
  const today = todayKey();
  let current: Usage;
  try {
    current = await readUsage();
  } catch {
    // A temporary state/blob outage must not disable customer support replies.
    current = transientUsage || { date: today, count: 0 };
  }
  const next = current.date === today ? current : { date: today, count: 0 };
  if (next.count >= DAILY_LIMIT) return false;
  next.count += 1;
  transientUsage = next;
  try {
    await writeUsage(next);
  } catch {
    // Keep the per-instance guard while the persistent store recovers.
  }
  return true;
}
