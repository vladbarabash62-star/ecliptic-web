import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(join(rootDir, "lib", "productStore.ts"), "utf8");

assert.match(source, /const PRODUCT_STORAGE_VERSION = 3;/);
assert.match(source, /version: PRODUCT_STORAGE_VERSION/);
assert.match(
  source,
  /storage\.version < PRODUCT_STORAGE_VERSION && CODE_AUTHORED_OFFER_SLUGS\.has\(slug\)/,
  "Code-authored offers should only override stale saved data"
);
assert.doesNotMatch(
  source,
  /baseProduct\.slug === "mobile-legends"\s*\|\|\s*baseProduct\.slug === "pubg-mobile"/,
  "Admin saves must not be permanently ignored for code-authored product slugs"
);
