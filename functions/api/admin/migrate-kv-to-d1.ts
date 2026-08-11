import {
  jsonResponse,
  optionsResponse,
  putDailyStats,
  putShortLink,
  putTotalStats,
  requireAuth,
  type Env,
  type ShortLink,
  type ShortLinkDailyStats,
  type ShortLinkTotalStats,
} from "../../_shared/shortlinks";
import { ensureSchema } from "../../_shared/db";
import { putApiKey, type ApiKey } from "../../_shared/apikeys";
import { insertMessage, type Message } from "../../_shared/messages";
import { putImageMeta, type ImageMeta } from "../../_shared/images";
import {
  putAccessLogs,
  putDayDetailStats,
  putDayStats,
  putGlobalStats,
  putResponseTimeStats,
  type AccessLogEntry,
  type DayDetailStats,
} from "../../_shared/statistics";

const META_KEY = "migration:kv-to-d1";

const listAllKeys = async (env: Env, prefix: string) => {
  const keys: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.MY_KV.list({ prefix, cursor });
    keys.push(...page.keys.map((item) => item.name));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return keys;
};

const parseJson = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;
    await ensureSchema(env);
    const row = await env.DB.prepare("SELECT value FROM meta WHERE key = ?").bind(META_KEY).first<{ value: string }>();
    return jsonResponse({
      success: true,
      data: {
        migrated: Boolean(row?.value),
        meta: row?.value ? JSON.parse(row.value) : null,
        note: "POST /api/admin/migrate-kv-to-d1 可执行一次性迁移；冷却/访客去重键仍保留在 KV。",
      },
    });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    await ensureSchema(env);

    const force = new URL(request.url).searchParams.get("force") === "1";
    const existing = await env.DB.prepare("SELECT value FROM meta WHERE key = ?").bind(META_KEY).first<{ value: string }>();
    if (existing?.value && !force) {
      return jsonResponse({
        success: false,
        error: "已迁移过。如需强制重跑，请 POST ?force=1",
        data: JSON.parse(existing.value),
      }, 409);
    }

    const summary = {
      shortLinks: 0,
      shortlinkTotalStats: 0,
      shortlinkDailyStats: 0,
      messages: 0,
      images: 0,
      apiKeys: 0,
      globalStats: 0,
      dayStats: 0,
      dayDetails: 0,
      responseTime: 0,
      accessLogs: 0,
      dailyReports: 0,
      startedAt: new Date().toISOString(),
      finishedAt: "",
    };

    // Short links
    const metaKeys = await listAllKeys(env, "shortlink:meta:");
    for (const key of metaKeys) {
      const link = parseJson<ShortLink>(await env.MY_KV.get(key));
      if (!link?.code) continue;
      await putShortLink(env, link);
      summary.shortLinks += 1;
    }

    const totalStatKeys = await listAllKeys(env, "shortlink:stats:");
    for (const key of totalStatKeys) {
      if (key.includes(":day:")) {
        const stats = parseJson<ShortLinkDailyStats>(await env.MY_KV.get(key));
        if (!stats?.code || !stats.date) continue;
        await putDailyStats(env, {
          code: stats.code,
          date: stats.date,
          clicks: stats.clicks || 0,
          uniqueVisitors: stats.uniqueVisitors || 0,
          referrers: stats.referrers || {},
          countries: stats.countries || {},
          updatedAt: stats.updatedAt || new Date().toISOString(),
        });
        summary.shortlinkDailyStats += 1;
        continue;
      }
      if (!key.endsWith(":total")) continue;
      const stats = parseJson<ShortLinkTotalStats>(await env.MY_KV.get(key));
      if (!stats?.code) continue;
      await putTotalStats(env, stats);
      summary.shortlinkTotalStats += 1;
    }

    // Messages (merge current + legacy)
    const messageBuckets = [
      parseJson<Message[]>(await env.MY_KV.get("messages:list")) || [],
      parseJson<Message[]>(await env.MY_KV.get("messages")) || [],
    ];
    const seenMessages = new Set<string>();
    for (const bucket of messageBuckets) {
      for (const message of bucket) {
        if (!message?.id || seenMessages.has(message.id)) continue;
        seenMessages.add(message.id);
        await insertMessage(env, {
          id: message.id,
          name: message.name || "匿名",
          content: message.content || "",
          createdAt: message.createdAt || new Date().toISOString(),
        });
        summary.messages += 1;
      }
    }

    // Images
    const imageKeys = await listAllKeys(env, "image:meta:");
    for (const key of imageKeys) {
      const image = parseJson<ImageMeta>(await env.MY_KV.get(key));
      if (!image?.id) continue;
      await putImageMeta(env, image);
      summary.images += 1;
    }

    // API keys
    const apiKeys = parseJson<ApiKey[]>(await env.MY_KV.get("apikeys_list")) || [];
    for (const key of apiKeys) {
      if (!key?.id) continue;
      await putApiKey(env, {
        id: key.id,
        website: key.website || "",
        mainSite: key.mainSite || "",
        apiKey: key.apiKey || "",
        balance: Number(key.balance) || 0,
        expiryDate: key.expiryDate || "",
        createdAt: key.createdAt || new Date().toISOString(),
        updatedAt: key.updatedAt,
      });
      summary.apiKeys += 1;
    }

    // Global / response-time
    const globalStats = parseJson<{
      totalVisitors: number;
      startedAt: string;
      updatedAt: string;
    }>(await env.MY_KV.get("stats:global"));
    if (globalStats) {
      await putGlobalStats(env, globalStats);
      summary.globalStats = 1;
    }

    const responseTime = parseJson<{
      averageResponseTime: number;
      totalSamples: number;
      updatedAt: string;
    }>(await env.MY_KV.get("stats:response-time"));
    if (responseTime) {
      await putResponseTimeStats(env, responseTime);
      summary.responseTime = 1;
    }

    // Day stats + details
    for (const key of await listAllKeys(env, "stats:day:")) {
      if (key.startsWith("stats:day-detail:")) continue;
      const date = key.replace("stats:day:", "");
      const stats = parseJson<{ date: string; visitors: number; updatedAt: string }>(await env.MY_KV.get(key));
      if (!stats) continue;
      await putDayStats(env, {
        date: stats.date || date,
        visitors: stats.visitors || 0,
        updatedAt: stats.updatedAt || new Date().toISOString(),
      });
      summary.dayStats += 1;
    }

    for (const key of await listAllKeys(env, "stats:day-detail:")) {
      const stats = parseJson<DayDetailStats>(await env.MY_KV.get(key));
      if (!stats?.date) continue;
      await putDayDetailStats(env, {
        date: stats.date,
        visits: stats.visits || 0,
        paths: stats.paths || {},
        countries: stats.countries || {},
        cities: stats.cities || {},
        referrers: stats.referrers || {},
        statuses: stats.statuses || {},
        hours: stats.hours || {},
        updatedAt: stats.updatedAt || new Date().toISOString(),
      });
      summary.dayDetails += 1;
    }

    const accessLogs = parseJson<AccessLogEntry[]>(await env.MY_KV.get("stats:access-logs")) || [];
    if (accessLogs.length) {
      await putAccessLogs(env, accessLogs);
      summary.accessLogs = accessLogs.length;
    }

    // Daily reports
    for (const key of await listAllKeys(env, "reports:daily:")) {
      const date = key.replace("reports:daily:", "");
      const reportJson = await env.MY_KV.get(key);
      if (!reportJson) continue;
      let generatedAt = new Date().toISOString();
      try {
        generatedAt = (JSON.parse(reportJson) as { generatedAt?: string }).generatedAt || generatedAt;
      } catch {
        // keep default
      }
      await env.DB.prepare(`
        INSERT INTO daily_reports (date, report_json, generated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(date) DO UPDATE SET
          report_json = excluded.report_json,
          generated_at = excluded.generated_at
      `).bind(date, reportJson, generatedAt).run();
      summary.dailyReports += 1;
    }

    summary.finishedAt = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO meta (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).bind(META_KEY, JSON.stringify(summary)).run();

    return jsonResponse({
      success: true,
      data: {
        ...summary,
        retainedInKv: [
          "message:cooldown:*",
          "image-generate:cooldown:*",
          "stats:visitor:*",
          "stats:visitor-day:*",
          "shortlink:visitor:*",
          "shortlink:visitor-day:*",
          "settings:media_api_key",
        ],
      },
    });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
