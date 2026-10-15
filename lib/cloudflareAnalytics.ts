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
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Cloudflare analytics unavailable (${response.status})`);
  return response.json();
}

export async function addCloudflareAnalyticsEvent(event: AnalyticsEvent) {
  await analyticsRequest("/event", event);
}

export async function readCloudflareAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  const result = await analyticsRequest("/events");
  if (!Array.isArray(result.events)) throw new Error("Invalid analytics response");
  return result.events;
}

export async function clearCloudflareAnalyticsEvents() {
  await analyticsRequest("/reset", {});
}
