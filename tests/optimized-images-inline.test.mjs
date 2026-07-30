import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const helperSource = readFileSync(join(rootDir, "lib", "optimizedImages.ts"), "utf8");

assert.equal(
  helperSource.includes("optimized-icons"),
  false,
  "Inline product images should not be swapped back to stale optimized-icons files"
);

assert.ok(
  helperSource.includes("return value;"),
  "Inline product images should be returned as saved"
);
