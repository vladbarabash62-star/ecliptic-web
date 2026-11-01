import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(join(rootDir, "app", "sitemap.xml", "route.ts"), "utf8");

assert.match(source, /Cache-Control.*s-maxage=300/);
assert.doesNotMatch(source, /X-Robots-Tag/);
assert.match(source, /new Set\(\["admin", "account", "api", "go", "robots", "sitemap", "sitemap-xml"\]\)/);
