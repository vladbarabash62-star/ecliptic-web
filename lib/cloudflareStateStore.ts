const stateUrl = () => String(process.env.CLOUDFLARE_ANALYTICS_URL || "").replace(/\/$/, "");

function headers() {
  return {
    Authorization: `Bearer ${process.env.CLOUDFLARE_ANALYTICS_SECRET || ""}`,
    "Content-Type": "application/json",
  };
}

export function hasCloudflareState() {
  return Boolean(stateUrl() && process.env.CLOUDFLARE_ANALYTICS_SECRET);
}

export async function readCloudflareState<T>(key: string): Promise<T | null> {
  if (!hasCloudflareState()) return null;
  const response = await fetch(`${stateUrl()}/state?key=${encodeURIComponent(key)}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Cloudflare state read failed: ${response.status}`);
  const body = await response.json() as { data?: T | null };
  return body.data ?? null;
}

export async function writeCloudflareState(key: string, data: unknown) {
  if (!hasCloudflareState()) throw new Error("Cloudflare state is not configured");
  const response = await fetch(`${stateUrl()}/state`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ key, data }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Cloudflare state write failed: ${response.status}`);
}
