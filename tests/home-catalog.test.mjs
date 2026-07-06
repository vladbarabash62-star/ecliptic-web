import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const homePageSource = readFileSync(join(rootDir, "app", "page.tsx"), "utf8");

assert.equal(
  homePageSource.includes("productShouldBeIndexed"),
  false,
  "Home catalog should show saved products even before they have priced offers"
);
