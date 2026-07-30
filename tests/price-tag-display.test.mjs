import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(join(rootDir, "app", "products", "[slug]", "ProductActionForms.tsx"), "utf8");

assert.equal(source.includes("₽"), false, "Visible product price UI should use Р instead of ₽");
assert.match(source, /function formatPriceTag\(priceRub: number\) \{\s*return `\$\{priceRub\} Р`;\s*\}/);
assert.match(
  source,
  /text-lg font-black leading-none text-emerald-300 sm:text-xl/,
  "Offer price tags should be visually larger"
);
