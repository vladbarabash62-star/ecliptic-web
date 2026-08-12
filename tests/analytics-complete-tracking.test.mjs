import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const publicApi = readFileSync(join(rootDir, "app", "api", "analytics", "route.ts"), "utf8");
const adminApi = readFileSync(join(rootDir, "app", "api", "admin", "analytics", "route.ts"), "utf8");
const adminPage = readFileSync(join(rootDir, "app", "admin", "route.ts"), "utf8");
const tracker = readFileSync(join(rootDir, "app", "components", "AnalyticsTracker.tsx"), "utf8");

assert.doesNotMatch(publicApi, /LTRIM/);
assert.match(publicApi, /checkRateLimit\("analytics", 5000, 60\)/);
assert.match(publicApi, /HINCRBY", ANALYTICS_TOTALS_KEY, "total", "1"/);
assert.match(publicApi, /HINCRBY", ANALYTICS_ACTIONS_KEY, type, "1"/);
assert.match(publicApi, /HINCRBY", ANALYTICS_PRODUCTS_KEY, product, "1"/);
assert.match(publicApi, /ipAddress = forwardedFor \|\| realIp \|\| undefined/);
assert.match(publicApi, /ipAddress,/);

assert.match(adminApi, /const DEFAULT_EVENTS_LIMIT = 200;/);
assert.match(adminApi, /const MAX_EVENTS_LIMIT = 1000;/);
assert.match(adminApi, /"LRANGE", ANALYTICS_KEY, String\(offset\), String\(end\)/);
assert.match(adminApi, /"LLEN", ANALYTICS_KEY/);
assert.match(adminApi, /pagination: \{/);
assert.match(adminApi, /"HGETALL", ANALYTICS_TOTALS_KEY/);
assert.match(adminApi, /"HGETALL", ANALYTICS_ACTIONS_KEY/);
assert.match(adminApi, /"HGETALL", ANALYTICS_PRODUCTS_KEY/);
assert.match(adminApi, /summary: \{/);

assert.match(adminPage, /var analyticsSummary = \{ total: 0, views: 0, buys: 0, telegram: 0, actions: \{\}, products: \{\} \};/);
assert.match(adminPage, /page_view: 'Просмотр страницы'/);
assert.match(adminPage, /buy_click: 'Клик Купить'/);
assert.match(adminPage, /Переход в Telegram/);
assert.match(adminPage, /IP-метка:/);
assert.match(adminPage, /IP: /);
assert.match(adminPage, /не выбран/);
assert.match(adminPage, /<th>Посетитель<\/th>/);
assert.doesNotMatch(adminPage, /slice\(0, 8\) \+ '\.\.\.'/);
assert.match(adminPage, /loadMoreEventsBtn/);
assert.match(adminPage, /analyticsEvents\.map/);
assert.match(adminPage, /analyticsEvents\.concat/);
assert.match(adminPage, /loadAnalytics\(analyticsPagination\.nextOffset \|\| analyticsEvents\.length\)/);

assert.match(tracker, /navigator\.sendBeacon/);
assert.match(tracker, /new Blob\(\[payload\], \{ type: "application\/json" \}\)/);
