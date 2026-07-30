import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(join(rootDir, "lib", "products.ts"), "utf8");

const mobileLegendsBlock = source.match(/name: "Mobile Legends"[\s\S]*?slug: "clash-of-clans"/)?.[0] || "";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const expectedOffers = [
  ['"50 + 50 алмазов"', "30"],
  ['"150 + 150 алмазов"', "70"],
  ['"250 + 250 алмазов"', "95"],
  ['"500 + 500 алмазов"', "185"],
  ['"72 алмаза"', "55"],
  ['"257 алмазов"', "80"],
  ['"429 алмазов"', "130"],
  ['"706 алмазов"', "175"],
  ['"Алмазный пропуск 7 дней"', "55"],
  ['"Элитный пропуск 7 дней"', "30"],
  ['"Эпический пропуск 30 дней"', "115"],
];

for (const [label, price] of expectedOffers) {
  assert.match(
    mobileLegendsBlock,
    new RegExp(`label: ${escapeRegExp(label)}, priceRub: ${price}`),
    `${label} should cost ${price} rubles`
  );
}
