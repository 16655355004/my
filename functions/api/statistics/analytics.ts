import {
  getAccessAnalytics,
  getAccessLogs,
  jsonResponse,
  optionsResponse,
  type Env,
} from "../../_shared/statistics";

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    return jsonResponse({
      success: true,
      data: getAccessAnalytics(await getAccessLogs(env)),
    });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
