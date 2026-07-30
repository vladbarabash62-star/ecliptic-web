import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const adminSource = readFileSync(join(rootDir, "app", "admin", "route.ts"), "utf8");
const apiSource = readFileSync(join(rootDir, "app", "api", "admin", "products", "route.ts"), "utf8");
const optimizedImagesSource = readFileSync(join(rootDir, "lib", "optimizedImages.ts"), "utf8");
const productStoreSource = readFileSync(join(rootDir, "lib", "productStore.ts"), "utf8");

assert.match(adminSource, /async function postJson\(url, body, timeoutMs\)/);
assert.match(adminSource, /postJson\('\/api\/admin\/products', \{ products: products \}, 120000\)/);
assert.match(adminSource, /postJson\('\/api\/admin\/settings', \{ settings: settings \}, 60000\)/);
assert.doesNotMatch(adminSource, /visibilitychange/);
assert.doesNotMatch(adminSource, /setInterval\(function\(\) \{\s*if \(!document\.hidden\) loadAnalytics\(\);\s*\}, 30000\)/);
assert.match(apiSource, /revalidatePath\("\/shop", "page"\)/);
assert.match(apiSource, /revalidatePath\("\/tags", "page"\)/);
assert.match(optimizedImagesSource, /const optimizedPathCache = new Map<string, string>\(\);/);
assert.match(productStoreSource, /timeoutMs: 20000/);
