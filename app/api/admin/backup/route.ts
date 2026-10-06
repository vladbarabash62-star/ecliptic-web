import { NextResponse } from "next/server";
import JSZip from "jszip";
import { readFallbackAnalyticsEvents, summarizeAnalyticsEvents } from "../../../../lib/analyticsFallbackStore";
import { buildProductStorage, getProducts } from "../../../../lib/productStore";
import { getSiteSettings } from "../../../../lib/siteSettings";
import { defaultSiteSettings } from "../../../../lib/siteSettingsDefaults";
import { validateAdminRequest } from "../../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE_ARCHIVE_URL = "https://github.com/vladbarabash62-star/ecliptic-web/archive/refs/heads/main.zip";

function timestampForFile() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function attachmentHeaders(filename: string, contentType: string) {
  return {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  };
}

async function adminDataBackup() {
  const [products, settings, analyticsEvents] = await Promise.all([
    getProducts(),
    getSiteSettings().catch(() => defaultSiteSettings),
    readFallbackAnalyticsEvents(),
  ]);

  return {
    kind: "ecliptic-admin-backup",
    version: 1,
    generatedAt: new Date().toISOString(),
    site: {
      name: "Ecliptic Store",
      url: "https://ecliptic.website",
      sourceArchiveUrl: SOURCE_ARCHIVE_URL,
    },
    settings,
    products,
    productStorage: buildProductStorage(products),
    analytics: {
      summary: summarizeAnalyticsEvents(analyticsEvents),
      events: analyticsEvents,
    },
  };
}

function restoreReadme() {
  return `Ecliptic Store full backup

Что внутри:
- исходный код сайта;
- backup-data/admin/products-storage.json — текущие товары, варианты, цены, иконки;
- backup-data/admin/site-settings.json — настройки главной страницы;
- backup-data/admin/analytics-events-v2.json — текущая аналитика;
- ecliptic-admin-data.json — полный читаемый экспорт админки.

Как запустить локально:
1. Распакуйте архив.
2. Откройте папку сайта в терминале.
3. Выполните: pnpm install
4. Выполните: pnpm dev
5. Откройте http://localhost:3000

Важно:
- Если запускать локально без Vercel Blob, сайт автоматически читает данные из папки backup-data.
- Поэтому товары и настройки должны открыться такими, какими они были на сайте в момент скачивания бэкапа.
- Для продакшена лучше использовать Vercel и подключенное Blob-хранилище.
`;
}

async function fullSiteBackupZip(backup: Awaited<ReturnType<typeof adminDataBackup>>) {
  const source = await fetch(SOURCE_ARCHIVE_URL, { cache: "no-store" });
  if (!source.ok) throw new Error("Source archive unavailable");

  const sourceBuffer = Buffer.from(await source.arrayBuffer());
  const zip = await JSZip.loadAsync(sourceBuffer);
  const firstFile = Object.keys(zip.files).find((name) => name.includes("/"));
  const root = firstFile ? firstFile.slice(0, firstFile.indexOf("/") + 1) : "";
  const dataRoot = `${root}backup-data/admin/`;

  zip.file(`${root}ecliptic-admin-data.json`, JSON.stringify(backup, null, 2));
  zip.file(`${root}RESTORE-RUN-LOCAL.txt`, restoreReadme());
  zip.file(`${dataRoot}products-storage.json`, JSON.stringify(backup.productStorage, null, 2));
  zip.file(`${dataRoot}site-settings.json`, JSON.stringify(backup.settings, null, 2));
  zip.file(`${dataRoot}analytics-events-v2.json`, JSON.stringify(backup.analytics.events, null, 2));
  zip.file(`${root}.env.local.example`, [
    "# Локально можно оставить пустым: сайт возьмет данные из backup-data.",
    "# Для продакшена подключите Vercel Blob или задайте BLOB_READ_WRITE_TOKEN.",
    "ADMIN_SECRET_PATH=",
    "ADMIN_PIN=Ecliptic-2706",
    "BLOB_READ_WRITE_TOKEN=",
    "",
  ].join("\n"));

  return await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

export async function GET(request: Request) {
  const authError = await validateAdminRequest(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "admin";
  const stamp = timestampForFile();

  if (type === "site") {
    try {
      const backup = await adminDataBackup();
      const archive = await fullSiteBackupZip(backup);

      return new Response(Buffer.from(archive), {
        headers: attachmentHeaders(`ecliptic-full-site-backup-${stamp}.zip`, "application/zip"),
      });
    } catch {
      return NextResponse.json(
        { ok: false, error: "Full site backup unavailable" },
        { status: 502 }
      );
    }
  }

  const backup = await adminDataBackup();
  return new Response(JSON.stringify(backup, null, 2), {
    headers: attachmentHeaders(`ecliptic-admin-data-${stamp}.json`, "application/json; charset=utf-8"),
  });
}
