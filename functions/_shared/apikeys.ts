import { ensureSchema } from "./db";
import type { Env } from "./shortlinks";

export interface ApiKey {
  id: number;
  website: string;
  mainSite: string;
  apiKey: string;
  balance: number;
  currency?: string;
  provider?: string;
  logoUrl?: string;
  balanceUpdatedAt?: string;
  expiryDate: string;
  createdAt: string;
  updatedAt?: string;
}

type ApiKeyRow = {
  id: number;
  website: string;
  main_site: string;
  api_key: string;
  balance: number;
  currency: string;
  provider: string;
  logo_url: string | null;
  balance_updated_at: string | null;
  expiry_date: string;
  created_at: string;
  updated_at: string | null;
};

const rowToApiKey = (row: ApiKeyRow): ApiKey => ({
  id: row.id,
  website: row.website,
  mainSite: row.main_site,
  apiKey: row.api_key,
  balance: row.balance,
  currency: row.currency || "USD",
  provider: row.provider || "custom",
  logoUrl: row.logo_url || undefined,
  balanceUpdatedAt: row.balance_updated_at || undefined,
  expiryDate: row.expiry_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at || undefined,
});

export const validateApiKey = (key: ApiKey): string | null => {
  if (![key.website, key.mainSite, key.apiKey].every((value) => typeof value === "string" && value.trim())) return "服务名、官网和密钥不能为空";
  if (!Number.isFinite(key.balance)) return "余额必须为有效数字";
  if (key.currency && !["USD", "CNY"].includes(key.currency)) return "不支持的币种";
  if (key.provider && !["custom", "deepseek", "openai", "anthropic", "gemini", "github"].includes(key.provider)) return "不支持的服务商";
  try {
    const site = new URL(key.mainSite);
    if (!["https:", "http:"].includes(site.protocol) || site.username || site.password) return "请输入有效官网 URL";
    if (key.logoUrl) {
      const logo = new URL(key.logoUrl);
      if (logo.protocol !== "https:" || logo.username || logo.password) return "Logo 仅支持 HTTPS 图片地址";
    }
  } catch {
    return "请输入有效的 URL";
  }
  if (key.expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(key.expiryDate)) return "有效期格式错误";
  return null;
};

export const listApiKeys = async (env: Env): Promise<ApiKey[]> => {
  await ensureSchema(env);
  const { results } = await env.DB.prepare(
    "SELECT * FROM api_keys ORDER BY id ASC",
  ).all<ApiKeyRow>();
  return (results || []).map(rowToApiKey);
};

export const getApiKey = async (env: Env, id: number): Promise<ApiKey | null> => {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT * FROM api_keys WHERE id = ?").bind(id).first<ApiKeyRow>();
  return row ? rowToApiKey(row) : null;
};

export const nextApiKeyId = async (env: Env): Promise<number> => {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT COALESCE(MAX(id), 0) AS max_id FROM api_keys").first<{ max_id: number }>();
  return (row?.max_id || 0) + 1;
};

export const putApiKey = async (env: Env, key: ApiKey) => {
  await ensureSchema(env);
  await env.DB.prepare(`
    INSERT INTO api_keys (
      id, website, main_site, api_key, balance, currency, provider, logo_url,
      balance_updated_at, expiry_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      website = excluded.website,
      main_site = excluded.main_site,
      api_key = excluded.api_key,
      balance = excluded.balance,
      currency = excluded.currency,
      provider = excluded.provider,
      logo_url = excluded.logo_url,
      balance_updated_at = excluded.balance_updated_at,
      expiry_date = excluded.expiry_date,
      updated_at = excluded.updated_at
  `).bind(
    key.id,
    key.website,
    key.mainSite,
    key.apiKey,
    key.balance ?? 0,
    key.currency || "USD",
    key.provider || "custom",
    key.logoUrl || null,
    key.balanceUpdatedAt || null,
    key.expiryDate || "",
    key.createdAt,
    key.updatedAt || null,
  ).run();
};

export const deleteApiKey = async (env: Env, id: number): Promise<ApiKey | null> => {
  const existing = await getApiKey(env, id);
  if (!existing) return null;
  await env.DB.prepare("DELETE FROM api_keys WHERE id = ?").bind(id).run();
  return existing;
};
