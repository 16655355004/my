import {
  assessTargetUrl,
  generateCode,
  getIndex,
  getShortLink,
  getTotalStats,
  isValidCode,
  jsonResponse,
  makeSummary,
  makeSummaryFromStats,
  optionsResponse,
  putIndex,
  putShortLink,
  putTotalStats,
  requireAuth,
  todayKey,
  type Env,
  type ShortLink,
  type ShortLinkInput,
} from "../../_shared/shortlinks";

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    const index = await getIndex(env);
    const links = (await Promise.all(index.codes.map((code) => getShortLink(env, code)))).filter(Boolean) as ShortLink[];
    const visibleLinks = links.filter((link) => !link.deletedAt);
    const totalStats = await Promise.all(visibleLinks.map((link) => getTotalStats(env, link.code)));
    const summaries = visibleLinks.map((link, index) => makeSummaryFromStats(request, link, totalStats[index]));
    summaries.sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    const totals = summaries.reduce((acc, link) => ({
      totalLinks: acc.totalLinks + 1,
      activeLinks: acc.activeLinks + (link.enabled ? 1 : 0),
      totalClicks: acc.totalClicks + link.totalClicks,
      todayClicks: acc.todayClicks + link.todayClicks,
    }), { totalLinks: 0, activeLinks: 0, totalClicks: 0, todayClicks: 0 });

    return jsonResponse({ success: true, data: { links: summaries, totals } });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    const body = await request.json() as ShortLinkInput;
    const title = body.title?.trim();
    const targetUrl = body.targetUrl?.trim();
    let code = body.code?.trim();

    if (!title || !targetUrl) {
      return jsonResponse({ success: false, error: "标题和目标 URL 必填" }, 400);
    }

    if (code && !isValidCode(code)) {
      return jsonResponse({ success: false, error: "短码只能包含字母、数字、下划线和短横线，长度 3-32" }, 400);
    }

    const index = await getIndex(env);
    if (!code) {
      do {
        code = generateCode();
      } while (index.codes.includes(code) || await getShortLink(env, code));
    }

    const risk = assessTargetUrl(targetUrl, new URL(request.url), code, env);
    if (risk.status === "blocked") {
      return jsonResponse({ success: false, error: risk.reasons[0]?.message || "目标 URL 风险过高", data: { risk } }, 400);
    }

    if (index.codes.includes(code) || await getShortLink(env, code)) {
      return jsonResponse({ success: false, error: "短码已存在" }, 409);
    }

    const now = new Date().toISOString();
    const link: ShortLink = {
      code,
      title,
      targetUrl: risk.normalizedUrl || targetUrl,
      description: body.description?.trim() || undefined,
      enabled: body.enabled ?? true,
      expiresAt: body.expiresAt || null,
      createdAt: now,
      risk,
    };

    await Promise.all([
      putShortLink(env, link),
      putIndex(env, [...index.codes, code]),
      putTotalStats(env, {
        code,
        totalClicks: 0,
        uniqueVisitors: 0,
        todayClicks: 0,
        todayKey: todayKey(),
        updatedAt: now,
      }),
    ]);

    return jsonResponse({ success: true, data: await makeSummary(env, request, link) }, 201);
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
