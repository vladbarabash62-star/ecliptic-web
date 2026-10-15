CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  time TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_time ON events(time DESC);

CREATE TABLE IF NOT EXISTS state (
  key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS state_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS state_history_key_id ON state_history(key, id DESC);
