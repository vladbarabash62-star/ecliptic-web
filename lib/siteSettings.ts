import { redisPipeline } from "./security";
import { defaultSiteSettings, normalizeSiteSettings, type SiteSettings } from "./siteSettingsDefaults";

const SITE_SETTINGS_KEY = "ecliptic:site:settings";
export const SITE_SETTINGS_CACHE_TAG = "ecliptic-site-settings";

export async function getSiteSettings(options: { cached?: boolean } = {}) {
  const result = await redisPipeline(
    [["GET", SITE_SETTINGS_KEY]],
    options.cached
      ? {
          cache: "force-cache",
          next: {
            tags: [SITE_SETTINGS_CACHE_TAG],
            revalidate: 3600,
          },
        }
      : undefined
  );
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

  await redisPipeline([["SET", SITE_SETTINGS_KEY, JSON.stringify(settings)]]);
  return settings;
}
