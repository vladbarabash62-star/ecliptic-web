const excludedVisitor = "8cf99251-32be-4daa-bd0a-4e9543668326";
const CHART_SNAPSHOT_KEY = "analytics:chart-snapshot:v1";
const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function ensureSchema(env) {
  if (!env.DB) return;
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, time TEXT NOT NULL, data TEXT NOT NULL)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS events_time ON events(time DESC)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS state_history (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS state_history_key_id ON state_history(key, id DESC)"),
  ]);
}

function filteredEvents(rows) {
  return rows
    .map((row) => {
      try { return JSON.parse(row.data); } catch { return null; }
    })
    .filter((event) => event && event.type !== "page_view" && event.visitorId !== excludedVisitor);
}

function summarize(events) {
  const actions = {};
  const products = {};
  let views = 0;
  let buys = 0;
  let telegram = 0;
  for (const event of events) {
    const type = String(event.type || "unknown");
    actions[type] = (actions[type] || 0) + 1;
    if (type === "product_open") {
      views += 1;
      if (event.product) products[event.product] = (products[event.product] || 0) + 1;
    }
    if (type === "buy_click") buys += 1;
    if (type.includes("telegram")) telegram += 1;
  }
  return { total: events.length, views, buys, telegram, actions, products };
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function mondayKey(date) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  return dayKey(copy);
}

function buildChartSnapshot(events) {
  const weeks = new Map();
  for (const event of events) {
    const date = new Date(event.time);
    if (Number.isNaN(date.getTime())) continue;
    const start = mondayKey(date);
    let week = weeks.get(start);
    if (!week) {
      week = { start, days: Array.from({ length: 7 }, (_, index) => ({ date: "", events: 0, buys: 0, views: 0, visitors: new Set() })) };
      const monday = new Date(`${start}T00:00:00.000Z`);
      week.days.forEach((day, index) => { const current = new Date(monday); current.setUTCDate(current.getUTCDate() + index); day.date = dayKey(current); });
      weeks.set(start, week);
    }
    const day = week.days.find((item) => item.date === dayKey(date));
    if (!day) continue;
    day.events += 1;
    if (event.type === "buy_click") day.buys += 1;
    if (event.type === "product_open") day.views += 1;
    const visitor = event.visitorId || event.sessionId;
    if (visitor) day.visitors.add(String(visitor));
  }
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    summary: summarize(events),
    weeks: [...weeks.values()].sort((left, right) => left.start.localeCompare(right.start)).map((week) => ({
      start: week.start,
      days: week.days.map((day) => ({ ...day, visitors: day.visitors.size })),
    })),
  };
}

async function eventStatement(db, event) {
  if (!event || typeof event !== "object" || event.visitorId === excludedVisitor || event.type === "page_view") return null;
  if (!event.type || !event.time || !Number.isFinite(Date.parse(event.time))) throw new Error("Invalid event");
  const data = JSON.stringify(event);
  if (data.length > 32000) throw new Error("Event too large");
  const identity = JSON.stringify([event.visitorId, event.sessionId, event.time, event.type, event.path, event.product, event.offer, event.price]);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
  const id = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return db.prepare("INSERT OR IGNORE INTO events (id, time, data) VALUES (?, ?, ?)").bind(id, new Date(event.time).toISOString(), data);
}

const worker = {
  async fetch(request, env) {
    if (!env.ANALYTICS_BRIDGE_SECRET || request.headers.get("Authorization") !== `Bearer ${env.ANALYTICS_BRIDGE_SECRET}`) return json({ error: "Unauthorized" }, 401);
    const path = new URL(request.url).pathname.replace(/^\/_analytics(?=\/|$)/, "");
    try {
      await ensureSchema(env);
      if (request.method === "GET" && path === "/events") {
        const url = new URL(request.url);
        const offset = Math.max(0, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0);
        const limit = Math.min(5000, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "1000", 10) || 1000));
        const [result, countResult] = await Promise.all([
          env.DB.prepare("SELECT data FROM events ORDER BY time DESC LIMIT ? OFFSET ?").bind(limit, offset).all(),
          env.DB.prepare("SELECT COUNT(*) AS count FROM events").first(),
        ]);
        const events = filteredEvents(result.results);
        const totalStored = Number(countResult?.count || 0);
        return json({ events, pagination: { offset, limit, loaded: events.length, totalStored, hasMore: offset + events.length < totalStored, nextOffset: offset + events.length } });
      }
      if (request.method === "GET" && path === "/summary") {
        const result = await env.DB.prepare("SELECT data FROM events ORDER BY time DESC").all();
        const events = filteredEvents(result.results);
        return json({ summary: summarize(events), totalStored: events.length });
      }
      if (request.method === "GET" && path === "/chart-snapshot") {
        const stored = await env.DB.prepare("SELECT data FROM state WHERE key = ?").bind(CHART_SNAPSHOT_KEY).first();
        if (stored?.data) return json({ snapshot: JSON.parse(stored.data), cached: true });
        const result = await env.DB.prepare("SELECT data FROM events ORDER BY time ASC").all();
        const snapshot = buildChartSnapshot(filteredEvents(result.results));
        await env.DB.prepare("INSERT INTO state (key, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO NOTHING")
          .bind(CHART_SNAPSHOT_KEY, JSON.stringify(snapshot), snapshot.generatedAt).run();
        return json({ snapshot, cached: false });
      }
      if (request.method === "GET" && path === "/health") {
        const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM events").first();
        return json({ ok: true, count: count.count });
      }
      if (request.method === "POST" && path === "/reset") {
        await env.DB.prepare("DELETE FROM events").run();
        return json({ ok: true });
      }
      if (request.method === "GET" && path === "/state") {
        const key = new URL(request.url).searchParams.get("key") || "";
        if (!/^[a-z0-9:_-]{1,80}$/i.test(key)) return json({ error: "Invalid key" }, 400);
        const row = await env.DB.prepare("SELECT data, updated_at FROM state WHERE key = ?").bind(key).first();
        return json({ ok: true, data: row ? JSON.parse(row.data) : null, updatedAt: row?.updated_at || null });
      }
      if (request.method === "GET" && path === "/state/history") {
        const key = new URL(request.url).searchParams.get("key") || "";
        if (!/^[a-z0-9:_-]{1,80}$/i.test(key)) return json({ error: "Invalid key" }, 400);
        const result = await env.DB.prepare("SELECT id, data, updated_at FROM state_history WHERE key = ? ORDER BY id DESC LIMIT 10").bind(key).all();
        return json({ ok: true, history: result.results.map((row) => ({ id: row.id, data: JSON.parse(row.data), updatedAt: row.updated_at })) });
      }
      if (request.method === "POST" && path === "/state") {
        const body = await request.json();
        const key = typeof body?.key === "string" ? body.key : "";
        if (!/^[a-z0-9:_-]{1,80}$/i.test(key) || body?.data === undefined) return json({ error: "Invalid state" }, 400);
        const data = JSON.stringify(body.data);
        if (data.length > 2000000) return json({ error: "State too large" }, 413);
        const updatedAt = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare("CREATE TABLE IF NOT EXISTS state_history (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL)"),
          env.DB.prepare("CREATE INDEX IF NOT EXISTS state_history_key_id ON state_history(key, id DESC)"),
          env.DB.prepare("INSERT INTO state_history (key, data, updated_at) SELECT key, data, updated_at FROM state WHERE key = ?").bind(key),
          env.DB.prepare("INSERT INTO state (key, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at").bind(key, data, updatedAt),
          env.DB.prepare("DELETE FROM state_history WHERE key = ? AND id NOT IN (SELECT id FROM state_history WHERE key = ? ORDER BY id DESC LIMIT 10)").bind(key, key),
        ]);
        return json({ ok: true, updatedAt });
      }
      if (request.method === "POST" && (path === "/event" || path === "/import")) {
        const raw = await request.text();
        if (raw.length > (path === "/import" ? 1000000 : 32000)) return json({ error: "Payload too large" }, 413);
        const body = JSON.parse(raw);
        const events = path === "/event" ? [body] : body.events;
        if (!Array.isArray(events) || events.length > 40) return json({ error: "Invalid batch" }, 400);
        const statements = (await Promise.all(events.map((event) => eventStatement(env.DB, event)))).filter(Boolean);
        if (statements.length) await env.DB.batch(statements);
        return json({ ok: true, accepted: statements.length });
      }
      return json({ error: "Not found" }, 404);
    } catch {
      return json({ error: "Analytics storage unavailable" }, 503);
    }
  },
};

export default worker;