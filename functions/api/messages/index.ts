import {
  jsonResponse,
  optionsResponse,
  type Env,
} from "../../_shared/shortlinks";
import { verifyTurnstile } from "../../_shared/turnstile";
import { insertMessage, listMessages, type Message } from "../../_shared/messages";

interface MessageInput {
  name?: string;
  content?: string;
  turnstileToken?: string;
}

const hashCooldown = async (request: Request, env: Env) => {
  const source = [
    request.headers.get("CF-Connecting-IP") || "unknown-ip",
    request.headers.get("User-Agent") || "unknown-agent",
    env.STATS_SALT || env.ADMIN_PASSWORD || "messages",
  ].join("|");
  const data = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    return jsonResponse({ success: true, data: { messages: await listMessages(env) } });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as MessageInput;
    const name = body.name?.trim().slice(0, 20);
    const content = body.content?.trim().slice(0, 500);

    if (!name || !content) return jsonResponse({ success: false, error: "姓名和留言内容必填" }, 400);

    const turnstile = await verifyTurnstile(request, env, body.turnstileToken);
    if (!turnstile.success) return jsonResponse({ success: false, error: turnstile.error || "人机验证失败" }, 403);

    const cooldownKey = `message:cooldown:${await hashCooldown(request, env)}`;
    if (await env.MY_KV.get(cooldownKey)) {
      return jsonResponse({ success: false, error: "留言太频繁，请稍后再试" }, 429);
    }

    const message: Message = {
      id: crypto.randomUUID(),
      name,
      content,
      createdAt: new Date().toISOString(),
    };

    await Promise.all([
      insertMessage(env, message),
      env.MY_KV.put(cooldownKey, "1", { expirationTtl: 90 }),
    ]);

    return jsonResponse({ success: true, data: message }, 201);
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
