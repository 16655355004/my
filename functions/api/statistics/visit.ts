import {
  jsonResponse,
  optionsResponse,
  recordVisit,
  type Env,
} from "../../_shared/statistics";

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json().catch(() => ({})) as { visitorId?: string };
    const data = await recordVisit(request, env, body.visitorId || "anonymous");
    return jsonResponse({ success: true, data });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
