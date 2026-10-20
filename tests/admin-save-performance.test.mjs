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
assert.match(adminSource, /postJson\('\/api\/admin\/products', compactDirtyProductsForSave\(\), 12000\)/);
assert.match(adminSource, /postJson\('\/api\/admin\/settings', \{ settings: settings \}, 12000\)/);
assert.doesNotMatch(adminSource, /visibilitychange/);
assert.doesNotMatch(adminSource, /setInterval\(function\(\) \{\s*if \(!document\.hidden\) loadAnalytics\(\);\s*\}, 30000\)/);
assert.match(apiSource, /revalidatePath\("\/", "page"\)/);
assert.match(apiSource, /revalidatePath\("\/", "layout"\)/);
assert.match(optimizedImagesSource, /const optimizedPathCache = new Map<string, string>\(\);/);
assert.match(productStoreSource, /timeoutMs: 500/);
