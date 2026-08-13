import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const layoutSource = readFileSync(join(rootDir, "app", "layout.tsx"), "utf8");
const cssSource = readFileSync(join(rootDir, "app", "globals.css"), "utf8");

assert.match(layoutSource, /<div className="site-corner-marker" aria-hidden="true" \/>/);
assert.match(cssSource, /\.site-corner-marker \{/);
assert.match(cssSource, /position: fixed;/);
assert.match(cssSource, /top: 10px;/);
assert.match(cssSource, /left: 10px;/);
assert.match(cssSource, /width: 18px;/);
assert.match(cssSource, /height: 18px;/);
assert.match(cssSource, /background: #ef1d1d;/);
