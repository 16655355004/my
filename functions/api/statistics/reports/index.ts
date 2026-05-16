import {
  jsonResponse,
  optionsResponse,
  requireAuth,
  type Env,
} from "../../../_shared/statistics";
import { getDailyReportSummaries } from "../../../_shared/reports";

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    const url = new URL(request.url);
    const days = Number(url.searchParams.get("days") || 14);
    return jsonResponse({ success: true, data: { reports: await getDailyReportSummaries(env, days) } });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
