import { getApiKey } from "../../../_shared/apikeys";
import { jsonResponse, optionsResponse, requireAuth, type Env } from "../../../_shared/shortlinks";

type BalanceInfo = {
  currency: string;
  total_balance: string;
  granted_balance: string;
  topped_up_balance: string;
};

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const respond = (data: unknown, status = 200) => {
    const response = jsonResponse(data, status);
    response.headers.set("Cache-Control", "no-store");
    return response;
  };
  const authError = requireAuth(request, env);
  if (authError) return authError;

  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return respond({ success: false, error: "无效的密钥 ID" }, 400);

  try {
    const key = await getApiKey(env, id);
    if (!key) return respond({ success: false, error: "密钥不存在" }, 404);
    const hostname = new URL(key.mainSite).hostname;
    const isDeepSeek = key.provider === "deepseek" ||
      (key.provider === "custom" && (hostname === "deepseek.com" || hostname.endsWith(".deepseek.com")));
    if (!isDeepSeek) return respond({ success: false, error: "此服务商暂不支持自动查询余额" }, 400);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch("https://api.deepseek.com/user/balance", {
        headers: { Authorization: `Bearer ${key.apiKey}`, Accept: "application/json" },
        redirect: "error",
        signal: controller.signal,
      });
      if (!response.ok) {
        const message = response.status === 401 ? "DeepSeek 密钥无效或已失效" :
          response.status === 429 ? "查询过于频繁，请稍后重试" : "DeepSeek 余额查询失败，请稍后重试";
        await response.body?.cancel();
        return respond({ success: false, error: message }, 502);
      }
      const data = await response.json() as { is_available?: boolean; balance_infos?: BalanceInfo[] };
      const balances = data.balance_infos;
      if (!Array.isArray(balances) || !balances.length || !balances.every((item) =>
        ["CNY", "USD"].includes(item.currency) && typeof item.total_balance === "string" &&
        item.total_balance.trim() !== "" && Number.isFinite(Number(item.total_balance)))) {
        return respond({ success: false, error: "DeepSeek 返回了无效的余额数据" }, 502);
      }
      const balance = balances.find((item) => item.currency === key.currency) || balances[0];
      const updatedAt = new Date().toISOString();
      const result = await env.DB.prepare(`
        UPDATE api_keys SET balance = ?, currency = ?, balance_updated_at = ?, updated_at = ?
        WHERE id = ? AND api_key = ? AND provider = ?
      `).bind(Number(balance.total_balance), balance.currency, updatedAt, updatedAt, id, key.apiKey, key.provider || "custom").run();
      if (!result.meta.changes) return respond({ success: false, error: "密钥记录已变更，请刷新列表后重试" }, 409);
      return respond({ success: true, data: {
        balance: Number(balance.total_balance), currency: balance.currency,
        balanceUpdatedAt: updatedAt, isAvailable: data.is_available,
      } });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return respond({ success: false, error: "余额刷新失败或请求超时，原余额已保留" }, 502);
  }
};
