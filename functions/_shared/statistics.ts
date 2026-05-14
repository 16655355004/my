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

export { corsHeaders, jsonResponse, optionsResponse, requireAuth, type Env };

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
    totalSeen ? Promise.resolve() : env.MY_KV.put(totalVisitorKey, "1"),
    daySeen ? Promise.resolve() : env.MY_KV.put(dayVisitorKey, "1", { expirationTtl: 60 * 60 * 24 * 45 }),
  ]);

  return {
    totalVisitors: globalStats.totalVisitors,
    todayVisitors: dayStats.visitors,
  };
};
