import {
  getDailyStats as getShortLinkDailyStats,
  getDateRange,
  getIndex,
  getShortLink,
  getTotalStats,
  type Env,
} from "./shortlinks";
import {
  getDayDetailStats,
  getDayStats,
  getResponseTimeStats,
} from "./statistics";
import { listImages } from "./images";

export interface ReportItem {
  name: string;
  value: number;
}

export interface DailySiteReport {
  date: string;
  generatedAt: string;
  visitors: number;
  visits: number;
  topPaths: ReportItem[];
  countries: ReportItem[];
  cities: ReportItem[];
  referrers: ReportItem[];
  hourly: Array<{ hour: string; value: number }>;
  responseTime: number;
  shortlinks: {
    totalClicks: number;
    uniqueVisitors: number;
    topLinks: Array<ReportItem & { code: string }>;
  };
  images: {
    total: number;
    uploadedToday: number;
  };
  messages: {
    total: number;
    createdToday: number;
  };
}

export interface DailySiteReportSummary {
  date: string;
  generatedAt: string;
  visitors: number;
  visits: number;
  totalClicks: number;
  topPath?: string;
  topCountry?: string;
}

interface MessageRecord {
  createdAt?: string;
}

const reportKey = (date: string) => `reports:daily:${date}`;

const topItems = (record: Record<string, number>, limit = 6): ReportItem[] => Object.entries(record)
  .map(([name, value]) => ({ name, value }))
  .sort((left, right) => right.value - left.value)
  .slice(0, limit);

const getMessages = async (env: Env): Promise<MessageRecord[]> => {
  const json = await env.MY_KV.get("messages:list");
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const generateDailyReport = async (env: Env, date: string): Promise<DailySiteReport> => {
  const [dayStats, dayDetail, responseStats, shortlinkIndex, images, messages] = await Promise.all([
    getDayStats(env, date),
    getDayDetailStats(env, date),
    getResponseTimeStats(env),
    getIndex(env),
    listImages(env).catch(() => []),
    getMessages(env),
  ]);

  const links = (await Promise.all(shortlinkIndex.codes.map((code) => getShortLink(env, code)))).filter(Boolean);
  const topLinks = [] as Array<ReportItem & { code: string }>;
  let totalClicks = 0;
  let uniqueVisitors = 0;

  for (const link of links) {
    if (!link || link.deletedAt) continue;
    const [daily, total] = await Promise.all([
      getShortLinkDailyStats(env, link.code, date),
      getTotalStats(env, link.code),
    ]);
    totalClicks += daily.clicks;
    uniqueVisitors += daily.uniqueVisitors;
    if (daily.clicks > 0) topLinks.push({ code: link.code, name: link.title, value: daily.clicks });
    if (date === new Date().toISOString().split("T")[0] && daily.clicks === 0 && total.todayClicks) {
      topLinks.push({ code: link.code, name: link.title, value: total.todayClicks });
    }
  }

  const report: DailySiteReport = {
    date,
    generatedAt: new Date().toISOString(),
    visitors: dayStats.visitors,
    visits: dayDetail.visits,
    topPaths: topItems(dayDetail.paths),
    countries: topItems(dayDetail.countries),
    cities: topItems(dayDetail.cities),
    referrers: topItems(dayDetail.referrers),
    hourly: Array.from({ length: 24 }, (_, index) => {
      const hour = String(index).padStart(2, "0");
      return { hour, value: dayDetail.hours[hour] || 0 };
    }),
    responseTime: Math.round(responseStats.averageResponseTime),
    shortlinks: {
      totalClicks,
      uniqueVisitors,
      topLinks: topLinks.sort((left, right) => right.value - left.value).slice(0, 6),
    },
    images: {
      total: images.length,
      uploadedToday: images.filter((image) => image.createdAt?.startsWith(date)).length,
    },
    messages: {
      total: messages.length,
      createdToday: messages.filter((message) => message.createdAt?.startsWith(date)).length,
    },
  };

  await env.MY_KV.put(reportKey(date), JSON.stringify(report));
  return report;
};

export const getDailyReport = async (env: Env, date: string): Promise<DailySiteReport> => {
  const json = await env.MY_KV.get(reportKey(date));
  if (json) return JSON.parse(json) as DailySiteReport;
  return generateDailyReport(env, date);
};

export const getDailyReportSummaries = async (env: Env, days: number): Promise<DailySiteReportSummary[]> => {
  const dates = getDateRange(Math.max(1, Math.min(days, 31)));
  const reports = await Promise.all(dates.map((date) => getDailyReport(env, date)));
  return reports.reverse().map((report) => ({
    date: report.date,
    generatedAt: report.generatedAt,
    visitors: report.visitors,
    visits: report.visits,
    totalClicks: report.shortlinks.totalClicks,
    topPath: report.topPaths[0]?.name,
    topCountry: report.countries[0]?.name,
  }));
};
