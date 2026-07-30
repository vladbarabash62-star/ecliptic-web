import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const formSource = readFileSync(join(rootDir, "app", "products", "[slug]", "ProductActionForms.tsx"), "utf8");
const pageSource = readFileSync(join(rootDir, "app", "products", "[slug]", "page.tsx"), "utf8");

assert.match(formSource, /export function SiteTopupForm/);
assert.match(formSource, /Ссылка:/);
assert.match(formSource, /Введите ссылку на сайт, который хотите пополнить/);
assert.match(formSource, /Сумма пополнения/);
assert.match(formSource, /Введите сумму/);
assert.match(formSource, /CURRENCY_RUB = "\\u20BD"/);
assert.match(formSource, /CURRENCY_PMR = "Р ПМР"/);
assert.match(formSource, /CURRENCY_USD = "\$"/);
assert.match(formSource, /CURRENCY_EUR = "\\u20AC"/);
assert.match(formSource, /100р РФ/);
assert.match(formSource, /30р ПМР/);
assert.match(formSource, /2\$/);
assert.match(formSource, /2\$\{CURRENCY_EUR\}/);
assert.match(formSource, /Сумма маленькая\. Минимальная сумма пополнения:/);
assert.match(formSource, /Пополнить/);

assert.match(pageSource, /SiteTopupForm/);
assert.match(pageSource, /product\.slug === "site-topups"/);
assert.match(pageSource, /<SiteTopupForm productName=\{product\.name\} productSlug=\{product\.slug\} \/>/);
