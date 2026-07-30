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
assert.match(formSource, /export function SbpPaymentForm/);
assert.match(formSource, /Сумма пополнения \(₽\)/);
assert.match(formSource, /Минимальная сумма пополнения 100₽\./);
const sbpFormBlock = formSource.match(/export function SbpPaymentForm[\s\S]*?export function ProductOffersWithDetails/);

assert.ok(sbpFormBlock, "Should find the SBP payment form block");
assert.doesNotMatch(sbpFormBlock[0], /Steam логин/);
assert.match(pageSource, /function isManagerButtonOnlyProduct/);
assert.match(pageSource, /product\.slug === "transfers"/);
assert.match(pageSource, /product\.slug\.startsWith\("card-withdrawal"\)/);
assert.match(pageSource, /name\.includes\("вывод с карты"\)/);
assert.match(pageSource, /<ManagerButtonForm productName={product\.name} productSlug={product\.slug} \/>/);
assert.match(pageSource, /product\.slug === "sbp-payment"/);
assert.match(pageSource, /<SbpPaymentForm productName={product\.name} productSlug={product\.slug} \/>/);
assert.equal(productsSource.includes('label: "ПМР"'), false, "SBP product data should no longer list the PMR option");
