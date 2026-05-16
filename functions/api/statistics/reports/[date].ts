import {
  jsonResponse,
  optionsResponse,
  requireAuth,
  type Env,
} from "../../../_shared/statistics";
import { generateDailyReport, getDailyReport } from "../../../_shared/reports";

const getDate = (params: EventContext<Env, string, unknown>["params"]) => String(params.date || "");
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    const date = getDate(params);
    if (!datePattern.test(date)) return jsonResponse({ success: false, error: "日期格式应为 YYYY-MM-DD" }, 400);

    return jsonResponse({ success: true, data: await getDailyReport(env, date) });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    const date = getDate(params);
    if (!datePattern.test(date)) return jsonResponse({ success: false, error: "日期格式应为 YYYY-MM-DD" }, 400);

    return jsonResponse({ success: true, data: await generateDailyReport(env, date) });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
