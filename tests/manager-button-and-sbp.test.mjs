import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const formSource = readFileSync(join(rootDir, "app", "products", "[slug]", "ProductActionForms.tsx"), "utf8");
const pageSource = readFileSync(join(rootDir, "app", "products", "[slug]", "page.tsx"), "utf8");

assert.match(formSource, /export function ManagerButtonForm/);
assert.match(formSource, /Написать менеджеру/);
assert.match(pageSource, /ManagerButtonForm/);
assert.match(pageSource, /product\.slug === "transfers"/);
assert.match(pageSource, /product\.slug === "sbp-payment"/);
assert.match(pageSource, /label: "100р РФ", priceRub: 30/);
