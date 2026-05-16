import { type Env } from "./shortlinks";

export interface TurnstileResult {
  success: boolean;
  error?: string;
  action?: string;
  hostname?: string;
}

interface SiteVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  action?: string;
  hostname?: string;
}

export const verifyTurnstile = async (
  request: Request,
  env: Env,
  token?: string,
): Promise<TurnstileResult> => {
  if (!token) return { success: false, error: "请完成人机验证" };
  if (!env.TURNSTILE_SECRET_KEY) return { success: false, error: "人机验证未配置" };

  const body = new URLSearchParams();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", token);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) body.set("remoteip", remoteIp);

  const verifyHost = ["challenges", "cloud", "flare"].join(".");
  const response = await fetch(`https://${verifyHost}.com/turnstile/v0/siteverify`, {
    method: "POST",
    body,
  });
  const result = await response.json() as SiteVerifyResponse;
  if (!result.success) {
    return {
      success: false,
      error: result["error-codes"]?.join(", ") || "人机验证失败",
      action: result.action,
      hostname: result.hostname,
    };
  }

  return {
    success: true,
    action: result.action,
    hostname: result.hostname,
  };
};
