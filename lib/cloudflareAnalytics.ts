import "server-only";
import type { AnalyticsEvent } from "./analyticsFallbackStore";

export function hasCloudflareAnalytics() {
  return Boolean(process.env.CLOUDFLARE_ANALYTICS_URL && process.env.CLOUDFLARE_ANALYTICS_SECRET);
}

async function analyticsRequest(path: string, body?: unknown) {
  const response = await fetch(`${process.env.CLOUDFLARE_ANALYTICS_URL?.replace(/\/$/, "")}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_ANALYTICS_SECRET}`,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
    // The events payload is intentionally complete for admin analytics and can be several MB.
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Cloudflare analytics unavailable (${response.status})`);
  return response.json();
}

export async function addCloudflareAnalyticsEvent(event: AnalyticsEvent) {
  await analyticsRequest("/event", event);
}

export async function readCloudflareAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  const events: AnalyticsEvent[] = [];
  let offset = 0;
  for (;;) {
    const page = await readCloudflareAnalyticsEventsPage(offset, 1000);
    events.push(...page.events);
    if (!page.pagination.hasMore) return events;
    offset = page.pagination.nextOffset;
  }
}

export async function readCloudflareAnalyticsEventsPage(offset = 0, limit = 1000): Promise<{ events: AnalyticsEvent[]; pagination: { offset: number; limit: number; loaded: number; totalStored: number; hasMore: boolean; nextOffset: number } }> {
  const result = await analyticsRequest(`/events?offset=${Math.max(0, Math.floor(offset))}&limit=${Math.min(5000, Math.max(1, Math.floor(limit)))}`);
  if (!Array.isArray(result.events) || !result.pagination) throw new Error("Invalid analytics response");
  return result as { events: AnalyticsEvent[]; pagination: { offset: number; limit: number; loaded: number; totalStored: number; hasMore: boolean; nextOffset: number } };
}

export async function readCloudflareAnalyticsSummary(): Promise<{ totalStored: number; summary: { total: number; views: number; buys: number; telegram: number; actions: Record<string, number>; products: Record<string, number> } }> {
  const result = await analyticsRequest("/summary");
  if (!result.summary || typeof result.totalStored !== "number") throw new Error("Invalid analytics summary");
  return result as { totalStored: number; summary: { total: number; views: number; buys: number; telegram: number; actions: Record<string, number>; products: Record<string, number> } };
}

export async function clearCloudflareAnalyticsEvents() {
  await analyticsRequest("/reset", {});
}
