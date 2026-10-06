import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readBlobJson, writeBlobJson } from "./blobJsonStore";

export type AnalyticsEvent = {
  type?: string;
  path?: string;
  product?: string;
  offer?: string;
  price?: number;
  time?: string;
  visitorId?: string;
  sessionId?: string;
  referrer?: string;
  language?: string;
  timezone?: string;
  screen?: string;
  ipAddress?: string;
  ipHash?: string;
  country?: string;
  region?: string;
  city?: string;
  userAgent?: string;
};

const MAX_FALLBACK_EVENTS = 5000;
const FALLBACK_DIR = join(tmpdir(), "ecliptic-store");
const FALLBACK_FILE = join(FALLBACK_DIR, "analytics-events-v2.json");
const ANALYTICS_BLOB = "admin/analytics-events-v2.json";

declare global {
  // eslint-disable-next-line no-var
  var __eclipticAnalyticsFallback: AnalyticsEvent[] | undefined;
}

function fallbackMemory() {
  if (!globalThis.__eclipticAnalyticsFallback) {
    globalThis.__eclipticAnalyticsFallback = [];
  }

  return globalThis.__eclipticAnalyticsFallback;
}

async function readDiskEvents() {
  try {
    const raw = await readFile(FALLBACK_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

async function writeDiskEvents(events: AnalyticsEvent[]) {
  try {
    await mkdir(FALLBACK_DIR, { recursive: true });
    await writeFile(FALLBACK_FILE, JSON.stringify(events.slice(0, MAX_FALLBACK_EVENTS)), "utf8");
  } catch {
    // /tmp is best-effort on serverless. Memory fallback still keeps the current instance useful.
  }
}

export async function addFallbackAnalyticsEvent(event: AnalyticsEvent) {
  const memory = fallbackMemory();
  if (!memory.length) {
    const blobEvents = await readBlobJson<AnalyticsEvent[]>(ANALYTICS_BLOB).catch(() => null);
    if (Array.isArray(blobEvents)) memory.push(...blobEvents.slice(0, MAX_FALLBACK_EVENTS));
  }

  memory.unshift(event);
  if (memory.length > MAX_FALLBACK_EVENTS) memory.length = MAX_FALLBACK_EVENTS;
  await writeBlobJson(ANALYTICS_BLOB, memory).catch(() => null);
  await writeDiskEvents(memory);
}

export async function readFallbackAnalyticsEvents() {
  const blobEvents = await readBlobJson<AnalyticsEvent[]>(ANALYTICS_BLOB).catch(() => null);
  if (Array.isArray(blobEvents)) {
    const memory = fallbackMemory();
    memory.length = 0;
    memory.push(...blobEvents.slice(0, MAX_FALLBACK_EVENTS));
    return memory;
  }

  const memory = fallbackMemory();
  if (memory.length) return memory;

  const diskEvents = await readDiskEvents();
  memory.push(...diskEvents.slice(0, MAX_FALLBACK_EVENTS));
  return memory;
}

export async function clearFallbackAnalyticsEvents() {
  const memory = fallbackMemory();
  memory.length = 0;
  await writeBlobJson(ANALYTICS_BLOB, []).catch(() => null);
  await writeDiskEvents([]);
}

export function summarizeAnalyticsEvents(events: AnalyticsEvent[]) {
  const actions: Record<string, number> = {};
  const products: Record<string, number> = {};
  let views = 0;
  let buys = 0;
  let telegram = 0;

  for (const event of events) {
    const type = String(event.type || "unknown");
    if (type === "page_view") continue;
    actions[type] = (actions[type] || 0) + 1;
    if (type === "product_open") views += 1;
    if (type === "buy_click") buys += 1;
    if (type.includes("telegram")) telegram += 1;
    if (event.product) products[event.product] = (products[event.product] || 0) + 1;
  }

  return {
    total: Object.values(actions).reduce((sum, count) => sum + count, 0),
    views,
    buys,
    telegram,
    actions,
    products,
  };
}
