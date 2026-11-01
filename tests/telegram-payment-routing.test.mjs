import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(join(rootDir, "app", "api", "telegram", "payment-webhook", "route.ts"), "utf8");

assert.match(source, /const shouldSendPaymentDetails = Boolean\(resolvedPayment\.quoteOnly && resolvedPayment\.hasPayment\);/);
assert.match(source, /sendOrderInstructions\([\s\S]*?resolvedPayment\.hasPayment,\r?\n\s+resolvedPayment\.product/);
assert.match(source, /if \(replied && resolvedPayment\.hasPayment\) \{/);
assert.match(source, /"brawl-stars": \["brawl pass", "brawl pass plus", "бравл пасс", "бравл пас"\]/);
assert.match(source, /другой регион\|pass\|пасс/);

console.log("PASS telegram-payment-routing.test.mjs");
