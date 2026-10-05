import { redisPipeline } from "./security";
import { defaultSiteSettings, normalizeSiteSettings, type SiteSettings } from "./siteSettingsDefaults";
import { readAdminFallback, writeAdminFallback } from "./adminFallbackStore";

const SITE_SETTINGS_KEY = "ecliptic:site:settings";
const SITE_SETTINGS_FALLBACK_KEY = "site-settings";
export const SITE_SETTINGS_CACHE_TAG = "ecliptic-site-settings";

export async function getSiteSettings(options: { cached?: boolean } = {}) {
  const fallback = await readAdminFallback<SiteSettings>(SITE_SETTINGS_FALLBACK_KEY);
  if (fallback) return normalizeSiteSettings(fallback);

  const result = await redisPipeline(
    [["GET", SITE_SETTINGS_KEY]],
    options.cached
      ? {
          cache: "force-cache",
          next: {
            tags: [SITE_SETTINGS_CACHE_TAG],
            revalidate: 3600,
          },
          timeoutMs: 500,
        }
      : { timeoutMs: 500 }
  ).catch(() => null);
  const raw = result?.[0]?.result;
  if (!raw || typeof raw !== "string") return defaultSiteSettings;

  try {
    return normalizeSiteSettings(JSON.parse(raw));
  } catch {
    return defaultSiteSettings;
  }
}

export async function saveSiteSettings(nextSettings: SiteSettings) {
  const settings = normalizeSiteSettings(nextSettings);

  await writeAdminFallback(SITE_SETTINGS_FALLBACK_KEY, settings);
  void redisPipeline([["SET", SITE_SETTINGS_KEY, JSON.stringify(settings)]], { timeoutMs: 300 }).catch(() => null);
  return settings;
}
