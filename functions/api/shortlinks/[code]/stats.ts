import {
  getDailyStats,
  getDateRange,
  getShortLink,
  getTotalStats,
  isValidCode,
  jsonResponse,
  optionsResponse,
  requireAuth,
  type Env,
} from "../../../_shared/shortlinks";

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    const code = String(params.code || "");
    if (!isValidCode(code)) return jsonResponse({ success: false, error: "无效短码" }, 400);

    const link = await getShortLink(env, code);
    if (!link || link.deletedAt) return jsonResponse({ success: false, error: "短链不存在" }, 404);

    const url = new URL(request.url);
    const requestedDays = Number(url.searchParams.get("days") || 30);
    const days = Math.min(90, Math.max(1, Number.isFinite(requestedDays) ? requestedDays : 30));
    const dates = getDateRange(days);
    const [total, dailyStats] = await Promise.all([
      getTotalStats(env, code),
      Promise.all(dates.map((date) => getDailyStats(env, code, date))),
    ]);

    return jsonResponse({
      success: true,
      data: {
        code,
        total,
        days: dailyStats,
      },
    });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
