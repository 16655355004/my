import {
  getIndex,
  getShortLink,
  isValidCode,
  jsonResponse,
  makeSummary,
  optionsResponse,
  putIndex,
  putShortLink,
  requireAuth,
  validateTargetUrl,
  type Env,
  type ShortLinkInput,
} from "../../_shared/shortlinks";

export const onRequestOptions: PagesFunction = async () => optionsResponse();

const getCode = (params: EventContext<Env, string, unknown>["params"]) => String(params.code || "");

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    const code = getCode(params);
    if (!isValidCode(code)) return jsonResponse({ success: false, error: "无效短码" }, 400);

    const link = await getShortLink(env, code);
    if (!link || link.deletedAt) return jsonResponse({ success: false, error: "短链不存在" }, 404);

    return jsonResponse({ success: true, data: await makeSummary(env, request, link) });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    const code = getCode(params);
    if (!isValidCode(code)) return jsonResponse({ success: false, error: "无效短码" }, 400);

    const link = await getShortLink(env, code);
    if (!link || link.deletedAt) return jsonResponse({ success: false, error: "短链不存在" }, 404);

    const body = await request.json() as ShortLinkInput;
    const nextTargetUrl = body.targetUrl?.trim() ?? link.targetUrl;
    const urlError = validateTargetUrl(nextTargetUrl, new URL(request.url), code);
    if (urlError) return jsonResponse({ success: false, error: urlError }, 400);

    const nextLink = {
      ...link,
      title: body.title?.trim() || link.title,
      targetUrl: nextTargetUrl,
      description: body.description !== undefined ? body.description.trim() || undefined : link.description,
      enabled: body.enabled ?? link.enabled,
      expiresAt: body.expiresAt !== undefined ? body.expiresAt || null : link.expiresAt,
      updatedAt: new Date().toISOString(),
    };

    await putShortLink(env, nextLink);
    return jsonResponse({ success: true, data: await makeSummary(env, request, nextLink) });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    const code = getCode(params);
    if (!isValidCode(code)) return jsonResponse({ success: false, error: "无效短码" }, 400);

    const link = await getShortLink(env, code);
    if (!link || link.deletedAt) return jsonResponse({ success: false, error: "短链不存在" }, 404);

    const index = await getIndex(env);
    const deletedLink = {
      ...link,
      enabled: false,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await Promise.all([
      putShortLink(env, deletedLink),
      putIndex(env, index.codes.filter((item) => item !== code)),
    ]);

    return jsonResponse({ success: true, data: deletedLink });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
