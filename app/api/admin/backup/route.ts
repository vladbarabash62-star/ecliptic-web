import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { deflateRawSync } from "node:zlib";
import { NextResponse } from "next/server";
import { getProducts } from "../../../../lib/productStore";
import {
  getRedisConfig,
  redisPipeline,
  validateAdminRequest,
  verifyBackupPassword,
} from "../../../../lib/security";
import { getSiteSettings } from "../../../../lib/siteSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANALYTICS_KEY = "ecliptic:analytics:events";
const INCLUDE_DIRS = ["app", "components", "lib", "models", "public", "services"];
const INCLUDE_FILES = [
  ".gitignore",
  ".vercelignore",
  "eslint.config.mjs",
  "middleware.ts",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "postcss.config.mjs",
  "README.md",
  "tsconfig.json",
  "vercel.json",
];
const EXCLUDED_DIRS = new Set([
  ".git",
  ".next",
  ".npm-cache",
  ".vercel",
  ".vercel-global",
  ".vercel-xdg-cache",
  ".vercel-xdg-config",
  ".vercel-xdg-data",
  "admin-backups",
  "node_modules",
  "out",
]);
const EXCLUDED_FILES = [/\.env/i, /local-.*\.log$/i, /\.tsbuildinfo$/i];

type RequestBody = {
  pin?: string;
  backupPassword?: string;
};

type ZipFile = {
  name: string;
  data: Buffer;
  mtime: Date;
};

const crcTable = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(data: Buffer) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosTime(date: Date) {
  return (
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2)
  );
}

function dosDate(date: Date) {
  const year = Math.max(1980, date.getFullYear());
  return ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
}

function normalizeZipName(name: string) {
  return name.replace(/\\/g, "/").replace(/^\/+/, "");
}

function zip(files: ZipFile[]) {
  const localChunks: Buffer[] = [];
  const centralChunks: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(normalizeZipName(file.name), "utf8");
    const compressed = deflateRawSync(file.data, { level: 6 });
    const crc = crc32(file.data);
    const time = dosTime(file.mtime);
    const date = dosDate(file.mtime);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localChunks.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralChunks.push(central, name);

    offset += local.length + name.length + compressed.length;
  }

  const centralSize = centralChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localChunks, ...centralChunks, end]);
}

function shouldSkip(relativePath: string) {
  const parts = normalizeZipName(relativePath).split("/");
  if (parts.some((part) => EXCLUDED_DIRS.has(part))) return true;
  return EXCLUDED_FILES.some((pattern) => pattern.test(relativePath));
}

async function collectDirectory(root: string, relativeDir: string, files: ZipFile[]) {
  if (shouldSkip(relativeDir)) return;

  const absoluteDir = path.join(root, relativeDir);
  const entries = await readdir(absoluteDir, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name);
    if (shouldSkip(relativePath)) continue;

    if (entry.isDirectory()) {
      await collectDirectory(root, relativePath, files);
      continue;
    }

    if (!entry.isFile()) continue;

    const absolutePath = path.join(root, relativePath);
    const info = await stat(absolutePath).catch(() => null);
    if (!info || info.size > 18_000_000) continue;

    files.push({
      name: `site-files/${normalizeZipName(relativePath)}`,
      data: await readFile(absolutePath),
      mtime: info.mtime,
    });
  }
}

async function collectProjectFiles() {
  const root = process.cwd();
  const files: ZipFile[] = [];

  for (const dir of INCLUDE_DIRS) {
    await collectDirectory(root, dir, files);
  }

  for (const file of INCLUDE_FILES) {
    if (shouldSkip(file)) continue;
    const absolutePath = path.join(root, file);
    const info = await stat(absolutePath).catch(() => null);
    if (!info?.isFile()) continue;
    files.push({
      name: `site-files/${file}`,
      data: await readFile(absolutePath),
      mtime: info.mtime,
    });
  }

  return files;
}

async function readAnalyticsEvents() {
  try {
    const result = await redisPipeline([["LRANGE", ANALYTICS_KEY, "0", "9999"]]);
    const rawEvents = result?.[0]?.result || [];
    return Array.isArray(rawEvents)
      ? rawEvents
          .map((item) => {
            try {
              return JSON.parse(item);
            } catch {
              return null;
            }
          })
          .filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function jsonFile(name: string, value: unknown): ZipFile {
  return {
    name,
    data: Buffer.from(JSON.stringify(value, null, 2), "utf8"),
    mtime: new Date(),
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const authError = await validateAdminRequest(request, body.pin);
  if (authError) return authError;

  if (!verifyBackupPassword(body.backupPassword || "")) {
    return NextResponse.json({ ok: false, error: "Wrong backup password" }, { status: 403 });
  }

  const [products, settings, analyticsEvents, projectFiles] = await Promise.all([
    getProducts(),
    getSiteSettings(),
    readAnalyticsEvents(),
    collectProjectFiles(),
  ]);

  const createdAt = new Date().toISOString();
  const dataFiles = [
    jsonFile("data/products.json", products),
    jsonFile("data/settings.json", settings),
    jsonFile("data/analytics-events.json", analyticsEvents),
    jsonFile("data/full-state.json", {
      ok: true,
      createdAt,
      site: "ecliptic.website",
      database: {
        configured: Boolean(getRedisConfig()),
        provider: "Vercel KV / Upstash Redis",
      },
      settings,
      products,
      analytics: {
        events: analyticsEvents,
      },
    }),
    jsonFile("data/backup-manifest.json", {
      createdAt,
      includes: [
        "site source files",
        "public assets",
        "package/config files",
        "current products",
        "current main-page settings",
        "analytics events from Redis",
      ],
      excludes: [
        "node_modules",
        ".git",
        ".next build cache",
        ".env files",
        "Vercel auth tokens",
        "local logs",
      ],
    }),
  ];
  const archive = zip([...dataFiles, ...projectFiles]);
  const stamp = createdAt.replace(/[:.]/g, "-");

  return new NextResponse(archive, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="ecliptic-full-backup-${stamp}.zip"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
