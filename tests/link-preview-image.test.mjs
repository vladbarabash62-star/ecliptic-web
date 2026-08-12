import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const seoSource = readFileSync(join(rootDir, "lib", "seo.ts"), "utf8");
const layoutSource = readFileSync(join(rootDir, "app", "layout.tsx"), "utf8");

assert.ok(existsSync(join(rootDir, "public", "ecliptic-og-preview-v3.png")));
assert.match(seoSource, /SITE_IMAGE = `\$\{SITE_URL\}\/ecliptic-og-preview-v3\.png`/);
assert.match(seoSource, /width: 1200,\s*height: 630/);
assert.match(seoSource, /type: "image\/png"/);
assert.match(seoSource, /card: "summary_large_image"/);
assert.match(seoSource, /images: \[SITE_IMAGE\]/);
assert.match(layoutSource, /width: 1200,\s*height: 630/);
assert.doesNotMatch(seoSource, /alt: `\$\{product\.name\} logo`/);
assert.doesNotMatch(layoutSource, /alt: `\$\{SITE_NAME\} logo`/);
