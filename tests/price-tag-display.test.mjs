import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(join(rootDir, "app", "products", "[slug]", "ProductActionForms.tsx"), "utf8");
const cssSource = readFileSync(join(rootDir, "app", "globals.css"), "utf8");

assert.equal(source.includes("₽"), false, "Visible product price UI should use р instead of ₽");
assert.match(source, /function formatPriceTag\(priceRub: number\) \{\s*return `\$\{priceRub\} р`;\s*\}/);
assert.match(
  source,
  /function priceTagFontSize\(priceRub: number\) \{\s*if \(priceRub >= 1000\) return 25;\s*if \(priceRub >= 300\) return 24;\s*if \(priceRub >= 100\) return 23;\s*if \(priceRub >= 50\) return 22;\s*return 20;\s*\}/,
  "Offer price size should grow with the price value while staying bounded"
);
assert.match(source, /style=\{priceTagStyle\(offer\.priceRub\)\}/);
assert.match(source, /className="offer-copy flex h-12 min-w-0 flex-col justify-center overflow-hidden"/);
assert.match(cssSource, /\.offer-price\s*\{[\s\S]*font-size: var\(--offer-price-size, 20px\);[\s\S]*white-space: nowrap;/);
assert.match(cssSource, /\.offer-copy\s*\{[\s\S]*min-height: 48px;/);
