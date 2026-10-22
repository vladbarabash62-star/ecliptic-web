import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const authSource = readFileSync(join(rootDir, "lib", "customerAuth.ts"), "utf8");
const accountSource = readFileSync(join(rootDir, "app", "account", "AccountTabs.tsx"), "utf8");
const adminSource = readFileSync(join(rootDir, "app", "admin", "route.ts"), "utf8");

assert.match(authSource, /store\.orders\.some\(\(order\) => order\.userId === user\.id\)/);
assert.match(authSource, /5 друзей и оформить хотя бы один заказ/);
assert.match(accountSource, /Пригласи 5 друзей, соверши любую покупку в магазине/);
assert.match(accountSource, /invitedCount >= 5 && orderCount > 0/);
assert.match(adminSource, /\(user\.orders \|\| \[\]\)\.length > 0/);
