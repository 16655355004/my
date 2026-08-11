import { listApiKeys } from "./apikeys";
import { type Env } from "./shortlinks";

const MEDIA_KV_KEY = "settings:media_api_key";
const PRORISE_MARKERS = ["prorisehub", "proapi", "newapi.prorisehub", "音视频"];

/**
 * 按优先级解析 ProRiseHub 生图令牌：
 * 1. Cloudflare 环境变量 MEDIA_API_KEY
 * 2. KV settings:media_api_key
 * 3. D1 密钥管理里标记为 ProRiseHub 的条目
 */
export async function resolveMediaApiKey(env: Env): Promise<string | null> {
  const fromEnv = env.MEDIA_API_KEY?.trim();
  if (fromEnv) return fromEnv;

  const fromKv = (await env.MY_KV.get(MEDIA_KV_KEY))?.trim();
  if (fromKv) return fromKv;

  try {
    const keys = await listApiKeys(env);
    const match = keys.find((item) => {
      const apiKey = item.apiKey?.trim();
      if (!apiKey?.startsWith("sk-")) return false;
      const haystack = `${item.website || ""} ${item.mainSite || ""}`.toLowerCase();
      return PRORISE_MARKERS.some((marker) => haystack.includes(marker));
    });
    return match?.apiKey?.trim() || null;
  } catch {
    return null;
  }
}

export async function isMediaGenerateEnabled(env: Env): Promise<boolean> {
  return Boolean(await resolveMediaApiKey(env));
}
