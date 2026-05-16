import { corsHeaders, jsonResponse, optionsResponse, requireAuth, todayKey, type Env } from "./shortlinks";

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

const accessLogKey = "stats:access-logs";
const maxAccessLogs = 200;

export const getGlobalStats = async (env: Env): Promise<GlobalStats> => {
  const json = await env.MY_KV.get("stats:global");
  if (json) return JSON.parse(json) as GlobalStats;

  const now = new Date().toISOString();
  return {
    totalVisitors: 0,
    startedAt: env.SITE_STARTED_AT || now,
    updatedAt: now,
  };
};

export const putGlobalStats = async (env: Env, stats: GlobalStats) => {
  await env.MY_KV.put("stats:global", JSON.stringify(stats));
};

export const getDayStats = async (env: Env, date = todayKey()): Promise<DayStats> => {
  const json = await env.MY_KV.get(`stats:day:${date}`);
  if (json) return JSON.parse(json) as DayStats;

  return {
    date,
    visitors: 0,
    updatedAt: new Date().toISOString(),
  };
};

export const putDayStats = async (env: Env, stats: DayStats) => {
  await env.MY_KV.put(`stats:day:${stats.date}`, JSON.stringify(stats));
};

export const getResponseTimeStats = async (env: Env): Promise<ResponseTimeStats> => {
  const json = await env.MY_KV.get("stats:response-time");
  if (json) return JSON.parse(json) as ResponseTimeStats;

  return {
    averageResponseTime: 120,
    totalSamples: 0,
    updatedAt: new Date().toISOString(),
  };
};

export const putResponseTimeStats = async (env: Env, stats: ResponseTimeStats) => {
  await env.MY_KV.put("stats:response-time", JSON.stringify(stats));
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
  const json = await env.MY_KV.get(accessLogKey);
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const putAccessLogs = async (env: Env, logs: AccessLogEntry[]) => {
  await env.MY_KV.put(accessLogKey, JSON.stringify(logs.slice(0, maxAccessLogs)));
};

export const getDayDetailStats = async (env: Env, date = todayKey()): Promise<DayDetailStats> => {
  const json = await env.MY_KV.get(`stats:day-detail:${date}`);
  if (json) return JSON.parse(json) as DayDetailStats;

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
};

export const putDayDetailStats = async (env: Env, stats: DayDetailStats) => {
  await env.MY_KV.put(`stats:day-detail:${stats.date}`, JSON.stringify(stats));
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
) => {
  const url = new URL(request.url);
  const logs = await getAccessLogs(env);
  const entry: AccessLogEntry = {
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    method: request.method,
    path: url.pathname,
    status,
    userAgent: request.headers.get("User-Agent") || "",
    referer: request.headers.get("Referer") || "",
    ...getGeo(request),
  };

  logs.unshift(entry);
  await Promise.all([
    putAccessLogs(env, logs),
    recordDayDetail(env, entry),
  ]);
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

export const recordVisit = async (request: Request, env: Env, visitorId: string) => {
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
  if (!totalSeen) globalStats.totalVisitors += 1;
  if (!daySeen) dayStats.visitors += 1;
  globalStats.updatedAt = now;
  dayStats.updatedAt = now;

  await Promise.all([
    putGlobalStats(env, globalStats),
    putDayStats(env, dayStats),
    recordAccessLog(request, env, 200),
    totalSeen ? Promise.resolve() : env.MY_KV.put(totalVisitorKey, "1"),
    daySeen ? Promise.resolve() : env.MY_KV.put(dayVisitorKey, "1", { expirationTtl: 60 * 60 * 24 * 45 }),
  ]);

  return {
    totalVisitors: globalStats.totalVisitors,
    todayVisitors: dayStats.visitors,
  };
};
