import { NextResponse } from "next/server";
import { readFallbackAnalyticsEvents, summarizeAnalyticsEvents } from "../../../../lib/analyticsFallbackStore";
import { getProducts } from "../../../../lib/productStore";
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
    analytics: {
      summary: summarizeAnalyticsEvents(analyticsEvents),
      events: analyticsEvents,
    },
  };
}

export async function GET(request: Request) {
  const authError = await validateAdminRequest(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "admin";
  const stamp = timestampForFile();

  if (type === "site") {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const archive = await fetch(SOURCE_ARCHIVE_URL, {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!archive.ok || !archive.body) {
        return NextResponse.json(
          { ok: false, error: "Site archive unavailable" },
          { status: 502 }
        );
      }

      return new Response(archive.body, {
        headers: attachmentHeaders(`ecliptic-site-source-${stamp}.zip`, "application/zip"),
      });
    } catch {
      return NextResponse.json(
        { ok: false, error: "Site archive unavailable" },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  const backup = await adminDataBackup();
  return new Response(JSON.stringify(backup, null, 2), {
    headers: attachmentHeaders(`ecliptic-admin-data-${stamp}.json`, "application/json; charset=utf-8"),
  });
}
