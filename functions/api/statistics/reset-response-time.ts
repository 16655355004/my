import {
  jsonResponse,
  optionsResponse,
  putResponseTimeStats,
  requireAuth,
  type Env,
} from "../../_shared/statistics";

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    await putResponseTimeStats(env, {
      averageResponseTime: 120,
      totalSamples: 0,
      updatedAt: new Date().toISOString(),
    });

    return jsonResponse({ success: true, data: { message: "响应时间统计已重置" } });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
