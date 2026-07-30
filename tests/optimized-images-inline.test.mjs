import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const helperSource = readFileSync(join(rootDir, "lib", "optimizedImages.ts"), "utf8");

assert.match(helperSource, /function isInlineImage/);
assert.match(helperSource, /if \(isInlineImage\(value\)\) return value;/);
assert.match(helperSource, /optimized-icons/);
