import { redisPipeline } from "./security";
import { defaultSiteSettings, normalizeSiteSettings, type SiteSettings } from "./siteSettingsDefaults";
import { readAdminFallback, writeAdminFallback } from "./adminFallbackStore";
import { readBlobJson, writeBlobJson } from "./blobJsonStore";
import { LOCAL_SETTINGS_SEED, readLocalBackupSeed } from "./localBackupSeed";

const SITE_SETTINGS_KEY = "ecliptic:site:settings";
const SITE_SETTINGS_FALLBACK_KEY = "site-settings";
const SITE_SETTINGS_BLOB = "admin/site-settings.json";
export const SITE_SETTINGS_CACHE_TAG = "ecliptic-site-settings";

export async function getSiteSettings() {
  const blobSettings = await readBlobJson<SiteSettings>(SITE_SETTINGS_BLOB).catch(() => null);
  if (blobSettings) return normalizeSiteSettings(blobSettings);

  const localSeed = await readLocalBackupSeed<SiteSettings>(LOCAL_SETTINGS_SEED);
  if (localSeed) return normalizeSiteSettings(localSeed);

  const result = await redisPipeline(
    [["GET", SITE_SETTINGS_KEY]],
    { timeoutMs: 2500 }
  ).catch(() => null);
  const raw = result?.[0]?.result;
  if (!raw || typeof raw !== "string") {
    const fallback = await readAdminFallback<SiteSettings>(SITE_SETTINGS_FALLBACK_KEY);
    return fallback ? normalizeSiteSettings(fallback) : defaultSiteSettings;
  }

  try {
    return normalizeSiteSettings(JSON.parse(raw));
  } catch {
    const fallback = await readAdminFallback<SiteSettings>(SITE_SETTINGS_FALLBACK_KEY);
    return fallback ? normalizeSiteSettings(fallback) : defaultSiteSettings;
  }
}

export async function saveSiteSettings(nextSettings: SiteSettings) {
  const settings = normalizeSiteSettings(nextSettings);

  await writeBlobJson(SITE_SETTINGS_BLOB, settings);
  await writeAdminFallback(SITE_SETTINGS_FALLBACK_KEY, settings);
  void redisPipeline([["SET", SITE_SETTINGS_KEY, JSON.stringify(settings)]], { timeoutMs: 300 }).catch(() => null);
  return settings;
}
