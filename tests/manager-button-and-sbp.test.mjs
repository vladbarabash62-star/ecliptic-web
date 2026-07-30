import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const formSource = readFileSync(join(rootDir, "app", "products", "[slug]", "ProductActionForms.tsx"), "utf8");
const pageSource = readFileSync(join(rootDir, "app", "products", "[slug]", "page.tsx"), "utf8");
const productsSource = readFileSync(join(rootDir, "lib", "products.ts"), "utf8");

assert.match(formSource, /export function ManagerButtonForm/);
assert.match(formSource, /Написать менеджеру/);
assert.match(pageSource, /function isManagerButtonOnlyProduct/);
assert.match(pageSource, /product\.slug === "transfers"/);
assert.match(pageSource, /product\.slug\.startsWith\("card-withdrawal"\)/);
assert.match(pageSource, /name\.includes\("вывод с карты"\)/);
assert.match(pageSource, /<ManagerButtonForm productName={product\.name} productSlug={product\.slug} \/>/);
assert.match(pageSource, /product\.slug === "sbp-payment"/);
assert.match(pageSource, /label: "100р РФ", priceRub: 30/);

const sbpBlockMatch = productsSource.match(/name: "Оплата по СБП"[\s\S]*?name: "Вывод с карты РФ"/);

assert.ok(sbpBlockMatch, "Should find the SBP product block");
assert.equal(sbpBlockMatch[0].includes("ПМР"), false, "SBP block should no longer list the PMR option");
