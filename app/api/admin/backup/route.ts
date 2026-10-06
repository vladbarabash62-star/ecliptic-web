import { NextResponse } from "next/server";
import JSZip from "jszip";
import { createHash } from "node:crypto";
import { readFallbackAnalyticsEvents, summarizeAnalyticsEvents } from "../../../../lib/analyticsFallbackStore";
import { buildProductStorage, getProducts } from "../../../../lib/productStore";
import type { Product, ProductOffer } from "../../../../lib/products";
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

На Windows можно просто запустить START-LOCAL-WINDOWS.bat.

Важно:
- Если запускать локально без Vercel Blob, сайт автоматически читает данные из папки backup-data.
- Поэтому товары и настройки должны открыться такими, какими они были на сайте в момент скачивания бэкапа.
- Для продакшена лучше использовать Vercel и подключенное Blob-хранилище.
`;
}

function windowsStartScript() {
  return `@echo off
cd /d "%~dp0"
echo Starting Ecliptic Store locally...
where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm not found, trying corepack...
  corepack enable
)
pnpm install
if errorlevel 1 (
  echo Failed to install dependencies.
  pause
  exit /b 1
)
pnpm dev
pause
`;
}

function extensionFromContentType(contentType: string | null) {
  const type = String(contentType || "").toLowerCase();
  if (type.includes("svg")) return "svg";
  if (type.includes("webp")) return "webp";
  if (type.includes("png")) return "png";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  return "bin";
}

function extensionFromDataUrl(value: string) {
  const match = value.match(/^data:image\/([a-z0-9.+-]+);base64,/i);
  if (!match) return "bin";
  if (match[1] === "jpeg") return "jpg";
  if (match[1] === "svg+xml") return "svg";
  return match[1];
}

function hashBuffer(buffer: Buffer) {
  return createHash("sha1").update(buffer).digest("hex").slice(0, 16);
}

async function addBackupAsset(zip: JSZip, root: string, value: string, cache: Map<string, string>) {
  if (!value || value.startsWith("/backup-assets/")) return value;
  if (cache.has(value)) return cache.get(value) || value;

  try {
    let buffer: Buffer;
    let extension = "bin";

    if (/^data:image\//i.test(value)) {
      const base64 = value.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "");
      buffer = Buffer.from(base64, "base64");
      extension = extensionFromDataUrl(value);
    } else if (/^https?:\/\//i.test(value)) {
      const response = await fetch(value, { cache: "no-store" });
      if (!response.ok) return value;
      buffer = Buffer.from(await response.arrayBuffer());
      extension = extensionFromContentType(response.headers.get("content-type"));
    } else {
      return value;
    }

    if (!buffer.length || buffer.length > 2_500_000) return value;

    const filename = `${hashBuffer(buffer)}.${extension}`;
    const zipPath = `${root}public/backup-assets/${filename}`;
    const publicPath = `/backup-assets/${filename}`;
    zip.file(zipPath, buffer);
    cache.set(value, publicPath);
    return publicPath;
  } catch {
    return value;
  }
}

async function localizeProductAssets(zip: JSZip, root: string, products: Product[]) {
  const cache = new Map<string, string>();
  const localized = JSON.parse(JSON.stringify(products)) as Product[];

  for (const product of localized) {
    product.icon = await addBackupAsset(zip, root, product.icon, cache);
    if (product.offerIcon) {
      product.offerIcon = await addBackupAsset(zip, root, product.offerIcon, cache);
    }

    for (const offer of product.offers) {
      if (offer.type === "divider") continue;
      const item = offer as ProductOffer;
      if (item.icon) item.icon = await addBackupAsset(zip, root, item.icon, cache);
    }
  }

  return {
    products: localized,
    assetCount: cache.size,
  };
}

async function fullSiteBackupZip(backup: Awaited<ReturnType<typeof adminDataBackup>>) {
  const source = await fetch(SOURCE_ARCHIVE_URL, { cache: "no-store" });
  if (!source.ok) throw new Error("Source archive unavailable");

  const sourceBuffer = Buffer.from(await source.arrayBuffer());
  const zip = await JSZip.loadAsync(sourceBuffer);
  const firstFile = Object.keys(zip.files).find((name) => name.includes("/"));
  const root = firstFile ? firstFile.slice(0, firstFile.indexOf("/") + 1) : "";
  const dataRoot = `${root}backup-data/admin/`;
  const localized = await localizeProductAssets(zip, root, backup.products);
  const localProductStorage = buildProductStorage(localized.products);
  const localBackup = {
    ...backup,
    products: localized.products,
    productStorage: localProductStorage,
    bundledAssets: localized.assetCount,
  };

  zip.file(`${root}ecliptic-admin-data.json`, JSON.stringify(localBackup, null, 2));
  zip.file(`${root}RESTORE-RUN-LOCAL.txt`, restoreReadme());
  zip.file(`${root}START-LOCAL-WINDOWS.bat`, windowsStartScript());
  zip.file(`${dataRoot}products-storage.json`, JSON.stringify(localProductStorage, null, 2));
  zip.file(`${dataRoot}site-settings.json`, JSON.stringify(backup.settings, null, 2));
  zip.file(`${dataRoot}analytics-events-v2.json`, JSON.stringify(backup.analytics.events, null, 2));
  zip.file(`${root}BACKUP-MANIFEST.txt`, [
    "Ecliptic Store backup manifest",
    `Generated at: ${backup.generatedAt}`,
    `Products: ${backup.products.length}`,
    `Analytics events: ${backup.analytics.events.length}`,
    `Bundled product images: ${localized.assetCount}`,
    "",
    "This archive intentionally does not include node_modules or .next.",
    "START-LOCAL-WINDOWS.bat installs dependencies and starts the local site.",
    "Product data in backup-data points to bundled /backup-assets files when the image could be downloaded.",
    "",
  ].join("\n"));
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
