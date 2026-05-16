import {
  assessTargetUrl,
  jsonResponse,
  optionsResponse,
  requireAuth,
  type Env,
} from "../../_shared/shortlinks";

interface RiskRequestBody {
  targetUrl?: string;
  code?: string;
}

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    const body = await request.json() as RiskRequestBody;
    const targetUrl = body.targetUrl?.trim();
    if (!targetUrl) return jsonResponse({ success: false, error: "目标 URL 必填" }, 400);

    return jsonResponse({
      success: true,
      data: assessTargetUrl(targetUrl, new URL(request.url), body.code?.trim(), env),
    });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
