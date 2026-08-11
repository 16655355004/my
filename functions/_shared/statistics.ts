import { corsHeaders, jsonResponse, optionsResponse, requireAuth, todayKey, type Env } from "./shortlinks";
import { ensureSchema, parseJsonRecord } from "./db";

interface GlobalStats {
  totalVisitors: number;
  startedAt: string;
  updatedAt: string;
}

interface DayStats {
  date: string;
  visitors: number;
  updatedAt: string;
}

interface ResponseTimeStats {
  averageResponseTime: number;
  totalSamples: number;
  updatedAt: string;
}

export interface AccessLogEntry {
  id: string;
  time: string;
  method: string;
  path: string;
  status: number;
  ip: string;
  country: string;
  region: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  colo: string;
  userAgent: string;
  referer: string;
}

export interface DayDetailStats {
  date: string;
  visits: number;
  paths: Record<string, number>;
  countries: Record<string, number>;
  cities: Record<string, number>;
  referrers: Record<string, number>;
  statuses: Record<string, number>;
  hours: Record<string, number>;
  updatedAt: string;
}

export interface AccessAnalytics {
  total: number;
  countries: Array<{ name: string; value: number }>;
  chinaCities: Array<{ name: string; value: [number, number, number] }>;
  geoPoints: Array<{ name: string; value: [number, number, number] }>;
  chinaHeatmap: Array<[number, number, number]>;
  topPaths: Array<{ name: string; value: number }>;
  hourly: Array<{ hour: string; value: number }>;
  updatedAt: string;
  recent: AccessLogEntry[];
}

export { corsHeaders, jsonResponse, optionsResponse, requireAuth, type Env };

const maxAccessLogs = 200;

type AccessLogRow = {
  id: string;
  time: string;
  method: string;
  path: string;
  status: number;
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  colo: string | null;
  user_agent: string | null;
  referer: string | null;
};

type DayDetailRow = {
  date: string;
  visits: number;
  paths_json: string;
  countries_json: string;
  cities_json: string;
  referrers_json: string;
  statuses_json: string;
  hours_json: string;
  updated_at: string;
};

const rowToAccessLog = (row: AccessLogRow): AccessLogEntry => ({
  id: row.id,
  time: row.time,
  method: row.method,
  path: row.path,
  status: row.status,
  ip: row.ip || "",
  country: row.country || "unknown",
  region: row.region || "",
  city: row.city || "",
  latitude: row.latitude,
  longitude: row.longitude,
  colo: row.colo || "",
  userAgent: row.user_agent || "",
  referer: row.referer || "",
});

export const getGlobalStats = async (env: Env): Promise<GlobalStats> => {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT * FROM stats_global WHERE id = 1").first<{
    total_visitors: number;
    started_at: string;
    updated_at: string;
  }>();
  if (row) {
    return {
      totalVisitors: row.total_visitors,
      startedAt: row.started_at,
      updatedAt: row.updated_at,
    };
  }

  const now = new Date().toISOString();
  return {
    totalVisitors: 0,
    startedAt: env.SITE_STARTED_AT || now,
    updatedAt: now,
  };
};

export const putGlobalStats = async (env: Env, stats: GlobalStats) => {
  await ensureSchema(env);
  await env.DB.prepare(`
    INSERT INTO stats_global (id, total_visitors, started_at, updated_at)
    VALUES (1, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      total_visitors = excluded.total_visitors,
      started_at = excluded.started_at,
      updated_at = excluded.updated_at
  `).bind(stats.totalVisitors, stats.startedAt, stats.updatedAt).run();
};

export const getDayStats = async (env: Env, date = todayKey()): Promise<DayStats> => {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT * FROM stats_day WHERE date = ?").bind(date).first<{
    date: string;
    visitors: number;
    updated_at: string;
  }>();
  if (row) {
    return { date: row.date, visitors: row.visitors, updatedAt: row.updated_at };
  }
  return { date, visitors: 0, updatedAt: new Date().toISOString() };
};

export const putDayStats = async (env: Env, stats: DayStats) => {
  await ensureSchema(env);
  await env.DB.prepare(`
    INSERT INTO stats_day (date, visitors, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      visitors = excluded.visitors,
      updated_at = excluded.updated_at
  `).bind(stats.date, stats.visitors, stats.updatedAt).run();
};

export const getResponseTimeStats = async (env: Env): Promise<ResponseTimeStats> => {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT * FROM stats_response_time WHERE id = 1").first<{
    average_response_time: number;
    total_samples: number;
    updated_at: string;
  }>();
  if (row) {
    return {
      averageResponseTime: row.average_response_time,
      totalSamples: row.total_samples,
      updatedAt: row.updated_at,
    };
  }
  return {
    averageResponseTime: 120,
    totalSamples: 0,
    updatedAt: new Date().toISOString(),
  };
};

export const putResponseTimeStats = async (env: Env, stats: ResponseTimeStats) => {
  await ensureSchema(env);
  await env.DB.prepare(`
    INSERT INTO stats_response_time (id, average_response_time, total_samples, updated_at)
    VALUES (1, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      average_response_time = excluded.average_response_time,
      total_samples = excluded.total_samples,
      updated_at = excluded.updated_at
  `).bind(stats.averageResponseTime, stats.totalSamples, stats.updatedAt).run();
};

export const formatUptime = (startedAt: string) => {
  const diff = Math.max(0, Date.now() - new Date(startedAt).getTime());
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const formatted = days > 0 ? `${days} days` : hours > 0 ? `${hours} hours` : `${minutes} minutes`;

  return { days, hours, minutes, formatted };
};

const getClientIp = (request: Request) =>
  request.headers.get("CF-Connecting-IP") ||
  request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
  "";

const getGeo = (request: Request) => {
  const cf = (request as Request & { cf?: Record<string, string> }).cf || {};
  return {
    ip: getClientIp(request),
    country: cf.country || request.headers.get("CF-IPCountry") || "unknown",
    region: cf.region || request.headers.get("CF-Region") || "",
    city: cf.city || request.headers.get("CF-IPCity") || "",
    latitude: Number(cf.latitude || request.headers.get("CF-Latitude") || 0) || null,
    longitude: Number(cf.longitude || request.headers.get("CF-Longitude") || 0) || null,
    colo: cf.colo || "",
  };
};

export const getAccessLogs = async (env: Env): Promise<AccessLogEntry[]> => {
  await ensureSchema(env);
  const { results } = await env.DB.prepare(
    "SELECT * FROM access_logs ORDER BY time DESC LIMIT ?",
  ).bind(maxAccessLogs).all<AccessLogRow>();
  return (results || []).map(rowToAccessLog);
};

export const putAccessLogs = async (env: Env, logs: AccessLogEntry[]) => {
  await ensureSchema(env);
  const trimmed = logs.slice(0, maxAccessLogs);
  const statements = [
    env.DB.prepare("DELETE FROM access_logs"),
    ...trimmed.map((entry) => env.DB.prepare(`
      INSERT INTO access_logs (
        id, time, method, path, status, ip, country, region, city,
        latitude, longitude, colo, user_agent, referer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      entry.id,
      entry.time,
      entry.method,
      entry.path,
      entry.status,
      entry.ip,
      entry.country,
      entry.region,
      entry.city,
      entry.latitude,
      entry.longitude,
      entry.colo,
      entry.userAgent,
      entry.referer,
    )),
  ];
  await env.DB.batch(statements);
};

export const getDayDetailStats = async (env: Env, date = todayKey()): Promise<DayDetailStats> => {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT * FROM stats_day_detail WHERE date = ?").bind(date).first<DayDetailRow>();
  if (!row) {
    return {
      date,
      visits: 0,
      paths: {},
      countries: {},
      cities: {},
      referrers: {},
      statuses: {},
      hours: {},
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    date: row.date,
    visits: row.visits,
    paths: parseJsonRecord(row.paths_json),
    countries: parseJsonRecord(row.countries_json),
    cities: parseJsonRecord(row.cities_json),
    referrers: parseJsonRecord(row.referrers_json),
    statuses: parseJsonRecord(row.statuses_json),
    hours: parseJsonRecord(row.hours_json),
    updatedAt: row.updated_at,
  };
};

export const putDayDetailStats = async (env: Env, stats: DayDetailStats) => {
  await ensureSchema(env);
  await env.DB.prepare(`
    INSERT INTO stats_day_detail (
      date, visits, paths_json, countries_json, cities_json,
      referrers_json, statuses_json, hours_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      visits = excluded.visits,
      paths_json = excluded.paths_json,
      countries_json = excluded.countries_json,
      cities_json = excluded.cities_json,
      referrers_json = excluded.referrers_json,
      statuses_json = excluded.statuses_json,
      hours_json = excluded.hours_json,
      updated_at = excluded.updated_at
  `).bind(
    stats.date,
    stats.visits,
    JSON.stringify(stats.paths || {}),
    JSON.stringify(stats.countries || {}),
    JSON.stringify(stats.cities || {}),
    JSON.stringify(stats.referrers || {}),
    JSON.stringify(stats.statuses || {}),
    JSON.stringify(stats.hours || {}),
    stats.updatedAt,
  ).run();
};

const increment = (target: Record<string, number>, key: string) => {
  target[key] = (target[key] || 0) + 1;
};

const normalizeReferrer = (value: string) => {
  if (!value) return "direct";
  try {
    return new URL(value).hostname || "direct";
  } catch {
    return "unknown";
  }
};

const recordDayDetail = async (env: Env, entry: AccessLogEntry) => {
  const date = entry.time.split("T")[0];
  const detail = await getDayDetailStats(env, date);
  detail.visits += 1;
  increment(detail.paths, entry.path || "/");
  increment(detail.countries, entry.country || "unknown");
  if (entry.city) increment(detail.cities, entry.city);
  increment(detail.referrers, normalizeReferrer(entry.referer));
  increment(detail.statuses, String(entry.status));
  increment(detail.hours, entry.time.slice(11, 13));
  detail.updatedAt = entry.time;
  await putDayDetailStats(env, detail);
};

export const recordAccessLog = async (
  request: Request,
  env: Env,
  status = 200,
  pathOverride?: string,
) => {
  await ensureSchema(env);
  const url = new URL(request.url);
  const entry: AccessLogEntry = {
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    method: request.method,
    path: pathOverride || url.pathname,
    status,
    userAgent: request.headers.get("User-Agent") || "",
    referer: request.headers.get("Referer") || "",
    ...getGeo(request),
  };

  await env.DB.prepare(`
    INSERT INTO access_logs (
      id, time, method, path, status, ip, country, region, city,
      latitude, longitude, colo, user_agent, referer
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    entry.id,
    entry.time,
    entry.method,
    entry.path,
    entry.status,
    entry.ip,
    entry.country,
    entry.region,
    entry.city,
    entry.latitude,
    entry.longitude,
    entry.colo,
    entry.userAgent,
    entry.referer,
  ).run();

  // Keep only the newest N rows.
  await env.DB.prepare(`
    DELETE FROM access_logs
    WHERE id NOT IN (
      SELECT id FROM access_logs ORDER BY time DESC LIMIT ?
    )
  `).bind(maxAccessLogs).run();

  await recordDayDetail(env, entry);
  return entry;
};

export const getAccessAnalytics = (logs: AccessLogEntry[]): AccessAnalytics => {
  const countries = new Map<string, number>();
  const cities = new Map<string, { name: string; value: [number, number, number] }>();
  const geoPoints = new Map<string, { name: string; value: [number, number, number] }>();
  const paths = new Map<string, number>();
  const hourly = new Map<string, number>();

  for (let index = 0; index < 24; index += 1) hourly.set(String(index).padStart(2, "0"), 0);

  for (const log of logs) {
    const country = log.country || "unknown";
    countries.set(country, (countries.get(country) || 0) + 1);
    paths.set(log.path || "/", (paths.get(log.path || "/") || 0) + 1);
    const hour = log.time.slice(11, 13);
    if (hour) hourly.set(hour, (hourly.get(hour) || 0) + 1);

    if (log.longitude && log.latitude) {
      const pointName = [log.country, log.region, log.city].filter(Boolean).join(" / ") || "unknown";
      const key = `${pointName}|${log.longitude}|${log.latitude}`;
      const current = geoPoints.get(key) || {
        name: pointName,
        value: [log.longitude, log.latitude, 0],
      };
      current.value[2] += 1;
      geoPoints.set(key, current);
    }

    if (country === "CN" && log.city && log.longitude && log.latitude) {
      const key = `${log.city}|${log.longitude}|${log.latitude}`;
      const current = cities.get(key) || {
        name: log.city,
        value: [log.longitude, log.latitude, 0],
      };
      current.value[2] += 1;
      cities.set(key, current);
    }
  }

  const chinaCities = [...cities.values()].sort((a, b) => b.value[2] - a.value[2]);

  return {
    total: logs.length,
    countries: [...countries.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    chinaCities,
    geoPoints: [...geoPoints.values()].sort((a, b) => b.value[2] - a.value[2]),
    chinaHeatmap: chinaCities.map((item) => item.value),
    topPaths: [...paths.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    hourly: [...hourly.entries()].map(([hour, value]) => ({ hour, value })),
    updatedAt: new Date().toISOString(),
    recent: logs.slice(0, 50),
  };
};

const hashVisitor = async (request: Request, env: Env, visitorId: string) => {
  const source = [
    visitorId,
    request.headers.get("CF-Connecting-IP") || "unknown-ip",
    request.headers.get("User-Agent") || "unknown-agent",
    env.STATS_SALT || env.ADMIN_PASSWORD || "site-statistics",
  ].join("|");
  const data = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const recordVisit = async (request: Request, env: Env, visitorId: string, pagePath?: string) => {
  const date = todayKey();
  const visitorHash = await hashVisitor(request, env, visitorId || "anonymous");
  const totalVisitorKey = `stats:visitor:${visitorHash}`;
  const dayVisitorKey = `stats:visitor-day:${date}:${visitorHash}`;
  const [globalStats, dayStats, totalSeen, daySeen] = await Promise.all([
    getGlobalStats(env),
    getDayStats(env, date),
    env.MY_KV.get(totalVisitorKey),
    env.MY_KV.get(dayVisitorKey),
  ]);

  const now = new Date().toISOString();
  globalStats.totalVisitors += 1;
  dayStats.visitors += 1;
  globalStats.updatedAt = now;
  dayStats.updatedAt = now;

  await Promise.all([
    putGlobalStats(env, globalStats),
    putDayStats(env, dayStats),
    recordAccessLog(request, env, 200, pagePath),
    totalSeen ? Promise.resolve() : env.MY_KV.put(totalVisitorKey, "1"),
    daySeen ? Promise.resolve() : env.MY_KV.put(dayVisitorKey, "1", { expirationTtl: 60 * 60 * 24 * 45 }),
  ]);

  return {
    totalVisitors: globalStats.totalVisitors,
    todayVisitors: dayStats.visitors,
  };
};
