import {
  formatUptime,
  getDayStats,
  getGlobalStats,
  getResponseTimeStats,
  jsonResponse,
  optionsResponse,
  type Env,
} from "../../_shared/statistics";

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const [globalStats, dayStats, responseStats] = await Promise.all([
      getGlobalStats(env),
      getDayStats(env),
      getResponseTimeStats(env),
    ]);

    return jsonResponse({
      success: true,
      data: {
        totalVisitors: globalStats.totalVisitors,
        todayVisitors: dayStats.visitors,
        responseTime: Math.round(responseStats.averageResponseTime),
        uptime: formatUptime(globalStats.startedAt),
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
