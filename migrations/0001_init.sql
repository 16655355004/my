-- D1 schema for jisoolove (database_id: 25fe29f0-080a-4b18-910a-842342b58c5a)
-- Cooldown / visitor-dedup keys stay in KV (TTL).

CREATE TABLE IF NOT EXISTS short_links (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  target_url TEXT NOT NULL,
  description TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  expires_at TEXT,
  last_accessed_at TEXT,
  deleted_at TEXT,
  risk_json TEXT
);

CREATE TABLE IF NOT EXISTS shortlink_stats_total (
  code TEXT PRIMARY KEY,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  today_clicks INTEGER NOT NULL DEFAULT 0,
  today_key TEXT,
  last_accessed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shortlink_stats_daily (
  code TEXT NOT NULL,
  date TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  referrers_json TEXT NOT NULL DEFAULT '{}',
  countries_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (code, date)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  alt TEXT NOT NULL,
  tone TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY,
  website TEXT NOT NULL,
  main_site TEXT NOT NULL,
  api_key TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  expiry_date TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS stats_global (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_visitors INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stats_day (
  date TEXT PRIMARY KEY,
  visitors INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stats_response_time (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  average_response_time REAL NOT NULL DEFAULT 120,
  total_samples INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS access_logs (
  id TEXT PRIMARY KEY,
  time TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status INTEGER NOT NULL,
  ip TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  latitude REAL,
  longitude REAL,
  colo TEXT,
  user_agent TEXT,
  referer TEXT
);

CREATE INDEX IF NOT EXISTS idx_access_logs_time ON access_logs(time DESC);

CREATE TABLE IF NOT EXISTS stats_day_detail (
  date TEXT PRIMARY KEY,
  visits INTEGER NOT NULL DEFAULT 0,
  paths_json TEXT NOT NULL DEFAULT '{}',
  countries_json TEXT NOT NULL DEFAULT '{}',
  cities_json TEXT NOT NULL DEFAULT '{}',
  referrers_json TEXT NOT NULL DEFAULT '{}',
  statuses_json TEXT NOT NULL DEFAULT '{}',
  hours_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_reports (
  date TEXT PRIMARY KEY,
  report_json TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
