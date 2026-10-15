const excludedVisitor = "8cf99251-32be-4daa-bd0a-4e9543668326";
const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

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
      if (request.method === "GET" && path === "/events") {
        const result = await env.DB.prepare("SELECT data FROM events ORDER BY time DESC LIMIT 5000").all();
        return json({ events: result.results.map((row) => JSON.parse(row.data)) });
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
