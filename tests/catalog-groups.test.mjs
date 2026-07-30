import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const gridSource = readFileSync(join(rootDir, "app", "components", "ProductSearchGrid.tsx"), "utf8");

for (const slug of ["steam", "gta-5-rp-majestic-rp", "majestic-rp", "arizona-rp", "epic-games-topup", "playstation"]) {
  assert.match(gridSource, new RegExp(`"${slug}"`), `${slug} should be listed as a game`);
}

for (const slug of ["boosty", "twitch"]) {
  assert.match(gridSource, new RegExp(`"${slug}"`), `${slug} should be listed as social`);
}

for (const phrase of ["majestic", "arizona", "аризона", "бусти", "твич"]) {
  assert.match(gridSource, new RegExp(phrase), `${phrase} should be recognized for admin-renamed products`);
}

assert.match(gridSource, /prefetch=\{false\}/);
assert.match(gridSource, /event\.currentTarget\.src = "\/loading-icon\.png"/);
