import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const adminSource = readFileSync(join(rootDir, "app", "admin", "route.ts"), "utf8");

assert.match(adminSource, /draggable="true" data-action="select-product"/);
assert.match(adminSource, /data-offer-drag-index/);
assert.match(adminSource, /function moveArrayItem/);
assert.match(adminSource, /handleProductDrop/);
assert.match(adminSource, /handleOfferDrop/);
assert.match(adminSource, /function handleDragWheel/);
assert.match(adminSource, /function updateDragAutoScroll/);
assert.match(adminSource, /window\.scrollBy\(\{ top: event\.deltaY, behavior: 'auto' \}\)/);
assert.match(adminSource, /\$\(\'productList\'\)\.addEventListener\(\'dragstart\', handleProductDragStart\)/);
assert.match(adminSource, /\$\(\'productEditor\'\)\.addEventListener\(\'drop\', handleOfferDrop\)/);
assert.match(adminSource, /document\.addEventListener\(\'wheel\', handleDragWheel, \{ passive: true \}\)/);
