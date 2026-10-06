import { readFile } from "node:fs/promises";
import { join } from "node:path";

const SEED_ROOT = "backup-data";

export const LOCAL_PRODUCTS_SEED = "admin/products-storage.json";
export const LOCAL_SETTINGS_SEED = "admin/site-settings.json";
export const LOCAL_ANALYTICS_SEED = "admin/analytics-events-v2.json";

export async function readLocalBackupSeed<T>(relativePath: string): Promise<T | null> {
  if (process.env.VERCEL) return null;

  try {
    const raw = await readFile(join(process.cwd(), SEED_ROOT, relativePath), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
