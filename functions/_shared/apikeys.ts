import { ensureSchema } from "./db";
import type { Env } from "./shortlinks";

export interface ApiKey {
  id: number;
  website: string;
  mainSite: string;
  apiKey: string;
  balance: number;
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
  expiryDate: row.expiry_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at || undefined,
});

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
      id, website, main_site, api_key, balance, expiry_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      website = excluded.website,
      main_site = excluded.main_site,
      api_key = excluded.api_key,
      balance = excluded.balance,
      expiry_date = excluded.expiry_date,
      updated_at = excluded.updated_at
  `).bind(
    key.id,
    key.website,
    key.mainSite,
    key.apiKey,
    key.balance ?? 0,
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
