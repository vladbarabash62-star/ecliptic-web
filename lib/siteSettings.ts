import { redisPipeline } from "./security";
import { unstable_cache } from "next/cache";
import { defaultSiteSettings, normalizeSiteSettings, type SiteSettings } from "./siteSettingsDefaults";
import { readAdminFallback, writeAdminFallback } from "./adminFallbackStore";
import { readBlobJson, writeBlobJson } from "./blobJsonStore";
import { LOCAL_SETTINGS_SEED, readLocalBackupSeed } from "./localBackupSeed";
import { hasCloudflareState, readCloudflareState, writeCloudflareState } from "./cloudflareStateStore";

const SITE_SETTINGS_KEY = "ecliptic:site:settings";
const SITE_SETTINGS_FALLBACK_KEY = "site-settings";
const SITE_SETTINGS_BLOB = "admin/site-settings.json";
export const SITE_SETTINGS_CACHE_TAG = "ecliptic-site-settings";

async function readSiteSettings() {
  if (hasCloudflareState()) {
    const state = await readCloudflareState<SiteSettings>(SITE_SETTINGS_FALLBACK_KEY);
    if (state) return normalizeSiteSettings(state);
  }
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

const readCachedSiteSettings = unstable_cache(readSiteSettings, ["ecliptic-site-settings-v2"], {
  tags: [SITE_SETTINGS_CACHE_TAG], revalidate: 600,
});

export function getSiteSettings() {
  // Settings are small and must reflect an admin save immediately.
  return readSiteSettings();
}

export async function saveSiteSettings(nextSettings: SiteSettings) {
  const settings = normalizeSiteSettings(nextSettings);

  if (hasCloudflareState()) {
    await writeCloudflareState(SITE_SETTINGS_FALLBACK_KEY, settings);
    return settings;
  }

  await writeBlobJson(SITE_SETTINGS_BLOB, settings);
  await writeAdminFallback(SITE_SETTINGS_FALLBACK_KEY, settings);
  void redisPipeline([["SET", SITE_SETTINGS_KEY, JSON.stringify(settings)]], { timeoutMs: 300 }).catch(() => null);
  return settings;
}
