export interface Env {
  MY_KV: KVNamespace;
  ADMIN_PASSWORD?: string;
  STATS_SALT?: string;
  SITE_STARTED_AT?: string;
}

export interface ShortLink {
  code: string;
  title: string;
  targetUrl: string;
  description?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string | null;
  lastAccessedAt?: string;
  deletedAt?: string;
}

export interface ShortLinkInput {
  title?: string;
  targetUrl?: string;
  code?: string;
  description?: string;
  enabled?: boolean;
  expiresAt?: string | null;
}

export interface ShortLinkIndex {
  codes: string[];
  updatedAt: string;
}

export interface ShortLinkTotalStats {
  code: string;
  totalClicks: number;
  uniqueVisitors: number;
  todayClicks?: number;
  todayKey?: string;
  lastAccessedAt?: string;
  updatedAt: string;
}

export interface ShortLinkDailyStats {
  code: string;
  date: string;
  clicks: number;
  uniqueVisitors: number;
  referrers: Record<string, number>;
  countries: Record<string, number>;
  updatedAt: string;
}

export interface ShortLinkSummary extends ShortLink {
  shortUrl: string;
  totalClicks: number;
  todayClicks: number;
  uniqueVisitors: number;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const codePattern = /^[A-Za-z0-9_-]{3,32}$/;

export const jsonResponse = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "Content-Type": "application/json",
    ...corsHeaders,
  },
});

export const optionsResponse = () => new Response(null, {
  status: 204,
  headers: corsHeaders,
});

export const verifyAuth = (request: Request, env: Env): boolean => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  return authHeader.slice(7) === (env.ADMIN_PASSWORD || "admin");
};

export const requireAuth = (request: Request, env: Env): Response | null => {
  if (verifyAuth(request, env)) return null;
  return jsonResponse({ success: false, error: "Unauthorized" }, 401);
};

export const isValidCode = (code: string) => codePattern.test(code);

export const todayKey = () => new Date().toISOString().split("T")[0];

export const getIndex = async (env: Env): Promise<ShortLinkIndex> => {
  const json = await env.MY_KV.get("shortlinks:index");
  if (!json) return { codes: [], updatedAt: new Date().toISOString() };
  try {
    const parsed = JSON.parse(json) as ShortLinkIndex;
    return {
      codes: Array.isArray(parsed.codes) ? parsed.codes : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return { codes: [], updatedAt: new Date().toISOString() };
  }
};

export const putIndex = async (env: Env, codes: string[]) => {
  const uniqueCodes = Array.from(new Set(codes));
  await env.MY_KV.put("shortlinks:index", JSON.stringify({
    codes: uniqueCodes,
    updatedAt: new Date().toISOString(),
  }));
};

export const getShortLink = async (env: Env, code: string): Promise<ShortLink | null> => {
  const json = await env.MY_KV.get(`shortlink:meta:${code}`);
  if (!json) return null;
  return JSON.parse(json) as ShortLink;
};

export const putShortLink = async (env: Env, link: ShortLink) => {
  await env.MY_KV.put(`shortlink:meta:${link.code}`, JSON.stringify(link));
};

export const getTotalStats = async (env: Env, code: string): Promise<ShortLinkTotalStats> => {
  const json = await env.MY_KV.get(`shortlink:stats:${code}:total`);
  if (!json) {
    return {
      code,
      totalClicks: 0,
      uniqueVisitors: 0,
      updatedAt: new Date().toISOString(),
    };
  }
  return JSON.parse(json) as ShortLinkTotalStats;
};

export const putTotalStats = async (env: Env, stats: ShortLinkTotalStats) => {
  await env.MY_KV.put(`shortlink:stats:${stats.code}:total`, JSON.stringify(stats));
};

export const getDailyStats = async (env: Env, code: string, date: string): Promise<ShortLinkDailyStats> => {
  const json = await env.MY_KV.get(`shortlink:stats:${code}:day:${date}`);
  if (!json) {
    return {
      code,
      date,
      clicks: 0,
      uniqueVisitors: 0,
      referrers: {},
      countries: {},
      updatedAt: new Date().toISOString(),
    };
  }
  return JSON.parse(json) as ShortLinkDailyStats;
};

export const putDailyStats = async (env: Env, stats: ShortLinkDailyStats) => {
  await env.MY_KV.put(`shortlink:stats:${stats.code}:day:${stats.date}`, JSON.stringify(stats));
};

export const validateTargetUrl = (targetUrl: string, requestUrl?: URL, code?: string): string | null => {
  try {
    const url = new URL(targetUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "目标 URL 只支持 http 或 https";
    if (requestUrl && code && url.origin === requestUrl.origin && url.pathname === `/s/${code}`) {
      return "目标 URL 不能指向自身短链";
    }
    return null;
  } catch {
    return "请输入有效 URL";
  }
};

export const generateCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const values = crypto.getRandomValues(new Uint8Array(7));
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
};

export const buildShortUrl = (request: Request, code: string) => `${new URL(request.url).origin}/s/${code}`;

export const isExpired = (link: ShortLink) => !!link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now();

export const makeSummary = async (env: Env, request: Request, link: ShortLink): Promise<ShortLinkSummary> => {
  return makeSummaryFromStats(request, link, await getTotalStats(env, link.code));
};

export const makeSummaryFromStats = (
  request: Request,
  link: ShortLink,
  total: ShortLinkTotalStats,
): ShortLinkSummary => ({
  ...link,
  shortUrl: buildShortUrl(request, link.code),
  totalClicks: total.totalClicks,
  todayClicks: total.todayKey === todayKey() ? total.todayClicks || 0 : 0,
  uniqueVisitors: total.uniqueVisitors,
  lastAccessedAt: total.lastAccessedAt || link.lastAccessedAt,
});

const normalizeReferrer = (value: string | null) => {
  if (!value) return "direct";
  try {
    return new URL(value).hostname || "direct";
  } catch {
    return "unknown";
  }
};

const hashVisitor = async (request: Request, env: Env, code: string) => {
  const source = [
    request.headers.get("CF-Connecting-IP") || "unknown-ip",
    request.headers.get("User-Agent") || "unknown-agent",
    code,
    env.STATS_SALT || env.ADMIN_PASSWORD || "shortlinks",
  ].join("|");
  const data = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const recordShortLinkClick = async (env: Env, request: Request, link: ShortLink) => {
  const now = new Date().toISOString();
  const date = todayKey();
  const visitorHash = await hashVisitor(request, env, link.code);
  const totalVisitorKey = `shortlink:visitor:${link.code}:${visitorHash}`;
  const dayVisitorKey = `shortlink:visitor-day:${link.code}:${date}:${visitorHash}`;
  const [total, daily, totalSeen, daySeen] = await Promise.all([
    getTotalStats(env, link.code),
    getDailyStats(env, link.code, date),
    env.MY_KV.get(totalVisitorKey),
    env.MY_KV.get(dayVisitorKey),
  ]);

  total.totalClicks += 1;
  total.todayClicks = total.todayKey === date ? (total.todayClicks || 0) + 1 : 1;
  total.todayKey = date;
  total.updatedAt = now;
  total.lastAccessedAt = now;
  if (!totalSeen) total.uniqueVisitors += 1;

  daily.clicks += 1;
  daily.updatedAt = now;
  if (!daySeen) daily.uniqueVisitors += 1;

  const referrer = normalizeReferrer(request.headers.get("Referer"));
  daily.referrers[referrer] = (daily.referrers[referrer] || 0) + 1;
  const country = request.headers.get("CF-IPCountry") || "unknown";
  daily.countries[country] = (daily.countries[country] || 0) + 1;

  const nextLink: ShortLink = { ...link, lastAccessedAt: now, updatedAt: now };

  await Promise.all([
    putTotalStats(env, total),
    putDailyStats(env, daily),
    putShortLink(env, nextLink),
    totalSeen ? Promise.resolve() : env.MY_KV.put(totalVisitorKey, "1"),
    daySeen ? Promise.resolve() : env.MY_KV.put(dayVisitorKey, "1", { expirationTtl: 60 * 60 * 24 * 45 }),
  ]);
};

export const getDateRange = (days: number) => {
  const dates: string[] = [];
  const current = new Date();
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(current);
    date.setUTCDate(current.getUTCDate() - index);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
};
