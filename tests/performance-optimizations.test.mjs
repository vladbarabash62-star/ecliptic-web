import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const spaceScene = readFileSync(join(rootDir, "components", "space-scene.tsx"), "utf8");
const pageLoader = readFileSync(join(rootDir, "app", "components", "PageLoader.tsx"), "utf8");
const homeButton = readFileSync(join(rootDir, "app", "components", "HomeButton.tsx"), "utf8");
const productGrid = readFileSync(join(rootDir, "app", "components", "ProductSearchGrid.tsx"), "utf8");
const productPage = readFileSync(join(rootDir, "app", "products", "[slug]", "page.tsx"), "utf8");
const globals = readFileSync(join(rootDir, "app", "globals.css"), "utf8");
const nextConfig = readFileSync(join(rootDir, "next.config.ts"), "utf8");

assert.doesNotMatch(spaceScene, /"use client"/);
assert.match(pageLoader, /hideSoon\(260\)/);
assert.match(pageLoader, /hideSoon\(760\)/);
assert.match(homeButton, /loading="lazy"/);
assert.doesNotMatch(homeButton, /priority/);
assert.match(productGrid, /width=\{180\}/);
assert.match(productGrid, /fetchPriority=\{index < 3 \? "high" : "auto"\}/);
assert.match(productPage, /width=\{180\}/);
assert.match(globals, /content-visibility: auto;/);
assert.match(globals, /contain-intrinsic-size: 180px 210px;/);
assert.match(nextConfig, /X-DNS-Prefetch-Control[\s\S]*?value: "on"/);
assert.match(nextConfig, /Cache-Control[\s\S]*?max-age=31536000, immutable/);
