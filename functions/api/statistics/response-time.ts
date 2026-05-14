import {
  getResponseTimeStats,
  jsonResponse,
  optionsResponse,
  putResponseTimeStats,
  type Env,
} from "../../_shared/statistics";

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json().catch(() => ({})) as { responseTime?: number };
    const responseTime = Number(body.responseTime);

    if (!Number.isFinite(responseTime) || responseTime <= 0 || responseTime > 60000) {
      return jsonResponse({ success: false, error: "无效响应时间" }, 400);
    }

    const stats = await getResponseTimeStats(env);
    const totalSamples = stats.totalSamples + 1;
    const averageResponseTime = ((stats.averageResponseTime * stats.totalSamples) + responseTime) / totalSamples;
    const nextStats = {
      averageResponseTime,
      totalSamples,
      updatedAt: new Date().toISOString(),
    };

    await putResponseTimeStats(env, nextStats);

    return jsonResponse({
      success: true,
      data: {
        averageResponseTime: Math.round(averageResponseTime),
        currentResponseTime: Math.round(responseTime),
      },
    });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
