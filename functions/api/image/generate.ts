import {
  jsonResponse,
  optionsResponse,
  type Env,
} from "../../_shared/shortlinks";
import { isMediaGenerateEnabled, resolveMediaApiKey } from "../../_shared/media";
import { verifyTurnstile } from "../../_shared/turnstile";

const MEDIA_API_BASE = "https://newapi.prorisehub.com";
const ALLOWED_MODELS = new Set([
  "nano-banana",
  "nano-banana-2",
  "nano-banana-pro",
  "gpt-image-2",
  "flux-2-pro",
  "flux-2-max",
  "google-imagen-4",
  "byte-plus-seedream-4",
  "byte-plus-seedream-4-5",
  "byte-plus-seedream-5-lite",
  "qwen-image-2",
  "qwen-image-2-pro",
  "qwen-image-plus",
  "wan2-7-image",
  "wan2-7-image-pro",
  "grok-imagine",
]);
const ALLOWED_ASPECT_RATIOS = new Set(["1:1", "16:9", "9:16", "3:2", "2:3", "4:3", "3:4"]);
const ALLOWED_QUALITY = new Set(["low", "medium", "high", "auto", "standard", "hd", "1k", "2k", "4k", "sd", "ultra"]);
const STYLE_PROMPTS: Record<string, string> = {
  anime: "anime style, cel shading, soft lighting, detailed, vibrant colors",
  illustration: "digital illustration, clean lines, rich details",
  pixel: "pixel art style, retro game aesthetic",
  watercolor: "watercolor painting style, soft edges, pastel tones",
};

interface GenerateInput {
  prompt?: string;
  negativePrompt?: string;
  model?: string;
  aspectRatio?: string;
  quality?: string;
  style?: string;
  turnstileToken?: string;
}

interface UpstreamImageResponse {
  data?: Array<{ url?: string; b64_json?: string; revised_prompt?: string }>;
  error?: { message?: string; type?: string };
}

const hashCooldown = async (request: Request, env: Env) => {
  const source = [
    request.headers.get("CF-Connecting-IP") || "unknown-ip",
    request.headers.get("User-Agent") || "unknown-agent",
    env.STATS_SALT || env.ADMIN_PASSWORD || "image-generate",
  ].join("|");
  const data = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const buildPrompt = (prompt: string, style?: string, negativePrompt?: string) => {
  const styleHint = style && STYLE_PROMPTS[style] ? `, ${STYLE_PROMPTS[style]}` : "";
  const negativeHint = negativePrompt?.trim() ? `. Avoid: ${negativePrompt.trim()}` : "";
  return `${prompt.trim()}${styleHint}${negativeHint}`.slice(0, 2000);
};

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const mediaApiKey = await resolveMediaApiKey(env);
    if (!mediaApiKey) {
      return jsonResponse({
        success: false,
        error: "生图服务尚未配置 MEDIA_API_KEY，请在 Cloudflare 变量中添加密钥并重新部署",
      }, 503);
    }

    const body = await request.json() as GenerateInput;
    const prompt = body.prompt?.trim();
    if (!prompt) return jsonResponse({ success: false, error: "请输入画面描述" }, 400);

    if (env.TURNSTILE_SECRET_KEY) {
      const turnstile = await verifyTurnstile(request, env, body.turnstileToken);
      if (!turnstile.success) {
        return jsonResponse({ success: false, error: turnstile.error || "人机验证失败" }, 403);
      }
    }

    const cooldownKey = `image-generate:cooldown:${await hashCooldown(request, env)}`;
    if (await env.MY_KV.get(cooldownKey)) {
      return jsonResponse({ success: false, error: "生成太频繁，请稍后再试" }, 429);
    }

    const model = body.model?.trim() || "qwen-image-2";
    if (!ALLOWED_MODELS.has(model)) {
      return jsonResponse({ success: false, error: "不支持的模型" }, 400);
    }

    const aspectRatio = body.aspectRatio?.trim() || "9:16";
    if (!ALLOWED_ASPECT_RATIOS.has(aspectRatio)) {
      return jsonResponse({ success: false, error: "不支持的画面比例" }, 400);
    }

    const quality = body.quality?.trim() || "medium";
    if (!ALLOWED_QUALITY.has(quality)) {
      return jsonResponse({ success: false, error: "不支持的画质选项" }, 400);
    }

    const fullPrompt = buildPrompt(prompt, body.style, body.negativePrompt);
    const upstream = await fetch(`${MEDIA_API_BASE}/v1/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mediaApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: fullPrompt,
        n: 1,
        aspect_ratio: aspectRatio,
        quality,
      }),
    });

    const payload = await upstream.json().catch(() => null) as UpstreamImageResponse | null;
    if (!upstream.ok || !payload) {
      const message = payload?.error?.message || `上游请求失败 (${upstream.status})`;
      return jsonResponse({ success: false, error: message }, upstream.status >= 500 ? 502 : 400);
    }

    const item = payload.data?.[0];
    const url = item?.url || (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : "");
    if (!url) return jsonResponse({ success: false, error: "未返回图片结果" }, 502);

    await env.MY_KV.put(cooldownKey, "1", { expirationTtl: 60 });

    return jsonResponse({
      success: true,
      data: {
        url,
        prompt: item.revised_prompt || fullPrompt,
        model,
        aspectRatio,
        quality,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
