import {
  corsHeaders,
  getShortLink,
  isExpired,
  isValidCode,
  jsonResponse,
  optionsResponse,
  recordShortLinkClick,
  type Env,
} from "../_shared/shortlinks";

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params, waitUntil }) => {
  try {
    const code = String(params.code || "");
    if (!isValidCode(code)) return jsonResponse({ success: false, error: "无效短码" }, 400);

    const link = await getShortLink(env, code);
    if (!link || link.deletedAt) return jsonResponse({ success: false, error: "短链不存在" }, 404);
    if (!link.enabled || isExpired(link)) return jsonResponse({ success: false, error: "短链已停用或过期" }, 410);

    waitUntil(recordShortLinkClick(env, request, link).catch(() => undefined));

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: link.targetUrl,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
